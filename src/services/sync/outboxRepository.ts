import type { OutboxItem } from "../../domain/offline";
import { emitOfflineRepositoryChange } from "../../data/repositories/revision";
import { useConnectivityStore } from "../../store/connectivity-store";
import { offlineDb } from "../offline/db";

export async function getOutboxItems() {
  return offlineDb.outbox.orderBy("createdAt").toArray();
}

export async function getOutboxItem(id: string) {
  return offlineDb.outbox.get(id);
}

export async function putOutboxItem(item: OutboxItem) {
  await offlineDb.outbox.put(item);
  await refreshSyncCounts();
}

export async function refreshSyncCounts() {
  try {
    const [pendingCount, failedCount] = await Promise.all([
      offlineDb.outbox.count(),
      offlineDb.outbox.where("status").equals("failed").count(),
    ]);
    useConnectivityStore.getState().setSyncCounts(pendingCount, failedCount);
    emitOfflineRepositoryChange();
    return { pendingCount, failedCount };
  } catch {
    useConnectivityStore.getState().setSyncCounts(0, 0);
    return { pendingCount: 0, failedCount: 0 };
  }
}

export function createOutboxItem(
  operation: OutboxItem["operation"],
  entityType: OutboxItem["entityType"],
  entityId: string,
  payload: unknown,
  createdAt: string,
): OutboxItem {
  const id = `outbox:${operation}:${entityId}`;
  return {
    id,
    clientMutationId:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `client-${operation}-${entityId}`,
    entityType,
    entityId,
    operation,
    payload,
    createdAt,
    attemptCount: 0,
    status: "pending",
  };
}
