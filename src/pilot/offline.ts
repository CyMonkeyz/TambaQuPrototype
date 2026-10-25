import Dexie, { type EntityTable } from "dexie";
import { cloud, saveRecord } from "./client";
import type { FarmAccess, Module, PilotRecord } from "./types";
interface Pending {
  id: string;
  farmId: string;
  kind: Module;
  data: Record<string, unknown>;
  createdAt: number;
}
export class PilotCache extends Dexie {
  records!: EntityTable<PilotRecord, "id">;
  pending!: EntityTable<Pending, "id">;
  access!: EntityTable<FarmAccess, "id">;
  constructor(userId: string) {
    super(`tambaqu-pilot-${userId}`);
    this.version(1).stores({
      records: "id,farm_id,kind",
      pending: "id,farmId,createdAt",
    });
    this.version(2).stores({ access: "id" });
  }
}
export async function queueRecord(
  cache: PilotCache,
  item: Omit<Pending, "id" | "createdAt">,
) {
  const mutation = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
  await cache.transaction("rw", cache.pending, cache.records, async () => {
    await cache.pending.add(mutation);
    await cache.records.add({
      id: mutation.id,
      farm_id: item.farmId,
      kind: item.kind,
      data: item.data,
      version: 0,
      created_at: new Date().toISOString(),
    });
  });
}
const running = new Map<string, Promise<void>>();
export function syncPilot(cache: PilotCache, userId: string): Promise<void> {
  const previous = running.get(userId);
  if (previous) return previous;
  const task = (async () => {
    const pending = await cache.pending.orderBy("createdAt").toArray();
    for (const item of pending) {
      const session = await cloud?.auth.getSession();
      if (session?.data.session?.user.id !== userId)
        throw new Error("Masuk kembali untuk menyinkronkan catatan.");
      await saveRecord(item.farmId, item.kind, item.data, item.id);
      await cache.transaction("rw", cache.pending, cache.records, async () => {
        await cache.pending.delete(item.id);
        await cache.records.delete(item.id);
      });
    }
  })().finally(() => running.delete(userId));
  running.set(userId, task);
  return task;
}
