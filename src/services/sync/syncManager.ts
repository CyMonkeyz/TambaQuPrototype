import type { ActionLog } from "../../domain/action";
import type { OutboxItem } from "../../domain/offline";
import { remoteRepositories } from "../../data/repositories/remote";
import { emitOfflineRepositoryChange } from "../../data/repositories/revision";
import { isDataConnectionAvailable, useConnectivityStore } from "../../store/connectivity-store";
import { offlineDb } from "../offline/db";
import { persistRemoteSnapshot } from "../offline/persistenceService";
import { getOutboxItems, refreshSyncCounts } from "./outboxRepository";

export interface SyncRemoteAdapter {
  createAction(action: ActionLog, clientMutationId: string): Promise<ActionLog>;
  acknowledgeAlert(id: string, userId: string, timestamp: string, clientMutationId: string): Promise<void>;
  resolveAlert(id: string, userId: string, timestamp: string, clientMutationId: string): Promise<void>;
}

const demoRemoteAdapter: SyncRemoteAdapter = {
  createAction: (action) => remoteRepositories.action.add({ ...action, syncStatus: "synced" }),
  acknowledgeAlert: async (id, userId, timestamp) => {
    await remoteRepositories.alert.acknowledge(id, userId, timestamp);
  },
  resolveAlert: async (id, userId, timestamp) => {
    await remoteRepositories.alert.resolve(id, userId, timestamp);
  },
};

let activeSync: Promise<{ synced: number; failed: number }> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const retryDelays = [1_000, 3_000, 10_000];

async function applyItem(item: OutboxItem, remote: SyncRemoteAdapter) {
  if (item.operation === "ACTION_LOG_CREATE") {
    const action = item.payload as ActionLog;
    const result = await remote.createAction(action, item.clientMutationId);
    await offlineDb.transaction("rw", [offlineDb.actionLogs, offlineDb.outbox], async () => {
      await offlineDb.actionLogs.put({ ...result, syncStatus: "synced" });
      await offlineDb.outbox.delete(item.id);
    });
    return;
  }
  const payload = item.payload as { id: string; userId: string; timestamp: string };
  if (item.operation === "ALERT_ACKNOWLEDGE") {
    await remote.acknowledgeAlert(payload.id, payload.userId, payload.timestamp, item.clientMutationId);
  } else {
    await remote.resolveAlert(payload.id, payload.userId, payload.timestamp, item.clientMutationId);
  }
  const remoteAlert = await remoteRepositories.alert.getById(payload.id);
  await offlineDb.transaction("rw", [offlineDb.alerts, offlineDb.outbox], async () => {
    if (remoteAlert) await offlineDb.alerts.put(remoteAlert);
    await offlineDb.outbox.delete(item.id);
  });
}

function scheduleRetry(failedItems: OutboxItem[]) {
  if (import.meta.env.MODE === "test" || retryTimer || !failedItems.length) return;
  const attempt = Math.min(...failedItems.map((item) => item.attemptCount));
  if (attempt >= retryDelays.length) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void syncPendingMutations();
  }, retryDelays[attempt]);
}

export function syncPendingMutations(remote: SyncRemoteAdapter = demoRemoteAdapter) {
  if (activeSync) return activeSync;
  activeSync = (async () => {
    if (!isDataConnectionAvailable()) return { synced: 0, failed: 0 };
    const store = useConnectivityStore.getState();
    const items = await getOutboxItems();
    if (!items.length) {
      await refreshSyncCounts();
      return { synced: 0, failed: 0 };
    }
    store.setSyncState("syncing", `Menyinkronkan ${items.length} perubahan...`);
    let synced = 0;
    let failed = 0;
    const failedItems: OutboxItem[] = [];
    for (const item of items) {
      if (item.attemptCount >= retryDelays.length) {
        failed += 1;
        failedItems.push(item);
        continue;
      }
      const processing = { ...item, status: "processing" as const, lastAttemptAt: new Date().toISOString() };
      await offlineDb.outbox.put(processing);
      try {
        await applyItem(processing, remote);
        synced += 1;
      } catch (error) {
        const failedItem: OutboxItem = {
          ...processing,
          status: "failed",
          attemptCount: processing.attemptCount + 1,
          lastError: error instanceof Error ? error.message : "Sinkronisasi gagal",
        };
        await offlineDb.outbox.put(failedItem);
        if (failedItem.operation === "ACTION_LOG_CREATE") {
          await offlineDb.actionLogs.update(failedItem.entityId, { syncStatus: "failed" });
        }
        failedItems.push(failedItem);
        failed += 1;
      }
    }
    await refreshSyncCounts();
    emitOfflineRepositoryChange();
    if (failed) {
      store.setSyncState("error", `${synced} perubahan tersinkron. ${failed} masih tertunda.`);
      scheduleRetry(failedItems);
    } else {
      store.markSynced(new Date().toISOString(), `${synced} perubahan berhasil tersinkron.`);
      await persistRemoteSnapshot();
    }
    return { synced, failed };
  })().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

export async function retryFailedSync(remote: SyncRemoteAdapter = demoRemoteAdapter) {
  const failed = await offlineDb.outbox.where("status").equals("failed").toArray();
  await offlineDb.transaction("rw", [offlineDb.outbox, offlineDb.actionLogs], async () => {
    await offlineDb.outbox.where("status").equals("failed").modify({ status: "pending", attemptCount: 0, lastError: undefined });
    await Promise.all(failed.filter((item) => item.operation === "ACTION_LOG_CREATE").map((item) => offlineDb.actionLogs.update(item.entityId, { syncStatus: "pending" })));
  });
  await refreshSyncCounts();
  return syncPendingMutations(remote);
}
