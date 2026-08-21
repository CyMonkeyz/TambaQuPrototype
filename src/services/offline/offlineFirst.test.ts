import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { ActionLog } from "../../domain/action";
import { resetMockDemoState } from "../../data/repositories/mock";
import { remoteRepositories } from "../../data/repositories/remote";
import { createOfflineFirstRepositories } from "../../data/repositories/offlineFirst";
import { useConnectivityStore } from "../../store/connectivity-store";
import { offlineDb } from "./db";
import { persistRemoteSnapshot, resetOfflineDataFromRemote } from "./persistenceService";
import { createOutboxItem, getOutboxItems, putOutboxItem, refreshSyncCounts } from "../sync/outboxRepository";
import { retryFailedSync, syncPendingMutations, type SyncRemoteAdapter } from "../sync/syncManager";

const repositories = createOfflineFirstRepositories(remoteRepositories);

function action(id: string, performedAt = "2026-08-20T15:00:00.000Z"): ActionLog {
  return {
    id,
    pondId: "pond-b",
    recommendationId: `rec-${id}`,
    actionTitle: "Periksa dan optimalkan aerasi",
    performedBy: "user-andi",
    performedAt,
    notes: "Aerator tambahan diaktifkan.",
    syncStatus: "synced",
  };
}

beforeEach(async () => {
  resetMockDemoState();
  await offlineDb.open();
  await Promise.all(offlineDb.tables.map((table) => table.clear()));
  await persistRemoteSnapshot();
  useConnectivityStore.setState({ demoOverride: "online", browserOnline: true, syncState: "idle" });
  await refreshSyncCounts();
});

describe("IndexedDB offline-first persistence", () => {
  it("initializes and seeds the baseline dataset", async () => {
    expect(await offlineDb.syncMeta.get("initialized")).toMatchObject({ value: "true" });
    expect(await offlineDb.ponds.count()).toBe(4);
    expect(await offlineDb.riskAssessments.get("risk-pond-b")).toMatchObject({ score: 22 });
  });

  it("saves one offline action and one outbox item atomically", async () => {
    useConnectivityStore.getState().setDemoOverride("offline");
    const input = action("offline-action");
    await repositories.action.add(input);
    await repositories.action.add(input);
    expect(await offlineDb.actionLogs.get(input.id)).toMatchObject({ syncStatus: "pending" });
    expect((await getOutboxItems()).filter((item) => item.entityId === input.id)).toHaveLength(1);
  });

  it("updates an alert locally and queues acknowledgement once", async () => {
    useConnectivityStore.getState().setDemoOverride("offline");
    await repositories.alert.acknowledge("alert-c-do", "user-andi", "2026-08-20T15:10:00.000Z");
    await repositories.alert.acknowledge("alert-c-do", "user-andi", "2026-08-20T15:10:00.000Z");
    expect(await offlineDb.alerts.get("alert-c-do")).toMatchObject({ status: "acknowledged" });
    expect((await getOutboxItems()).filter((item) => item.entityId === "alert-c-do")).toHaveLength(1);
  });

  it("syncs oldest actions first and removes successful outbox items", async () => {
    const order: string[] = [];
    const adapter: SyncRemoteAdapter = {
      createAction: async (item) => { order.push(item.id); return { ...item, syncStatus: "synced" }; },
      acknowledgeAlert: async () => undefined,
      resolveAlert: async () => undefined,
    };
    await putOutboxItem(createOutboxItem("ACTION_LOG_CREATE", "actionLog", "second", action("second", "2026-08-20T15:02:00.000Z"), "2026-08-20T15:02:00.000Z"));
    await putOutboxItem(createOutboxItem("ACTION_LOG_CREATE", "actionLog", "first", action("first", "2026-08-20T15:01:00.000Z"), "2026-08-20T15:01:00.000Z"));
    await offlineDb.actionLogs.bulkPut([action("first"), action("second")]);
    await syncPendingMutations(adapter);
    expect(order).toEqual(["first", "second"]);
    expect(await offlineDb.outbox.count()).toBe(0);
    expect(await offlineDb.actionLogs.get("first")).toMatchObject({ syncStatus: "synced" });
  });

  it("keeps failed sync visible and supports manual retry", async () => {
    const input = action("retry-action");
    await offlineDb.actionLogs.put({ ...input, syncStatus: "pending" });
    await putOutboxItem(createOutboxItem("ACTION_LOG_CREATE", "actionLog", input.id, input, input.performedAt));
    const failing: SyncRemoteAdapter = {
      createAction: async () => { throw new Error("Remote sementara tidak tersedia"); },
      acknowledgeAlert: async () => undefined,
      resolveAlert: async () => undefined,
    };
    await syncPendingMutations(failing);
    expect(await offlineDb.outbox.get(`outbox:ACTION_LOG_CREATE:${input.id}`)).toMatchObject({ status: "failed", attemptCount: 1 });
    expect(await offlineDb.actionLogs.get(input.id)).toMatchObject({ syncStatus: "failed" });
    const succeeding: SyncRemoteAdapter = { ...failing, createAction: async (item) => ({ ...item, syncStatus: "synced" }) };
    await retryFailedSync(succeeding);
    expect(await offlineDb.outbox.count()).toBe(0);
  });

  it("explicit reset clears outbox and reseeds the stable baseline", async () => {
    await putOutboxItem(createOutboxItem("ACTION_LOG_CREATE", "actionLog", "discarded", action("discarded"), "2026-08-20T15:00:00.000Z"));
    resetMockDemoState();
    await resetOfflineDataFromRemote();
    expect(await offlineDb.outbox.count()).toBe(0);
    expect(await offlineDb.riskAssessments.get("risk-pond-b")).toMatchObject({ score: 22 });
  });
});
