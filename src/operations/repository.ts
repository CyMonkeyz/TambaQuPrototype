import Dexie, { type EntityTable } from "dexie";
import { api, cloud } from "../pilot/client";
import {
  definitions,
  validateEntity,
  type Entity,
  type EntityKind,
  type Definition,
} from "./model";
export type Rows = Partial<
  Record<EntityKind | "alerts" | "quotes" | "contracts" | "invoices", Entity[]>
>;
type Cached = Entity & { kind: string };
export interface Pending {
  id: string;
  farmId: string;
  kind: EntityKind;
  data: Record<string, unknown>;
  entityId?: string;
  version?: number;
  createdAt: number;
  status: "pending" | "conflict" | "failed";
  error?: string;
}
export class OperationsCache extends Dexie {
  entities!: EntityTable<Cached, "id">;
  pending!: EntityTable<Pending, "id">;
  readonly accountId: string;
  constructor(accountId: string) {
    super(`tambaqu-operations-${accountId}`);
    this.accountId = accountId;
    this.version(1).stores({
      entities: "id,[farm_id+kind],farm_id",
      pending: "id,farmId,status,createdAt",
    });
  }
}
export async function listEntities(farmId: string, kind: string) {
  const rows: Entity[] = [];
  const asOf = new Date().toISOString();
  let offset: number | null = 0;
  while (offset !== null) {
    const page: { rows: Entity[]; next: number | null } = await api(
      "ops-list",
      { farmId, kind, offset, asOf },
    );
    rows.push(...page.rows);
    offset = page.next;
    if (offset !== null)
      await new Promise((resolve) => setTimeout(resolve, 650));
  }
  return rows;
}
export async function refreshSnapshot(cache: OperationsCache, farmId: string) {
  const snapshot = await api<{ rows: Rows; more: string[] }>("ops-snapshot", {
    farmId,
  });
  await cache.transaction("rw", cache.entities, async () => {
    await cache.entities.where("farm_id").equals(farmId).delete();
    for (const [kind, records] of Object.entries(snapshot.rows))
      await cache.entities.bulkPut(
        (records ?? []).map((r) => ({ ...r, kind })),
      );
  });
  const rows: Rows = {};
  for (const kind of Object.keys(snapshot.rows))
    rows[kind as keyof Rows] = await cachedRows(cache, farmId, kind);
  return { rows, more: snapshot.more };
}
export async function queueEntity(
  cache: OperationsCache,
  farmId: string,
  kind: EntityKind,
  data: Record<string, unknown>,
  edit?: Entity,
) {
  const values = validateEntity(kind, data);
  data = {
    ...values,
    ...(data.pond_id ? { pond_id: data.pond_id } : {}),
    ...(data.cycle_id ? { cycle_id: data.cycle_id } : {}),
  };
  return cache.transaction("rw", cache.pending, async () => {
    const id = crypto.randomUUID();
    const pending: Pending = {
      id,
      farmId,
      kind,
      data,
      entityId: edit?.id,
      version: edit?.version,
      createdAt: Date.now(),
      status: "pending",
    };
    // One pending edit per row avoids ambiguous offline overwrite chains.
    if (
      edit &&
      (await cache.pending.toArray()).some((r) => r.entityId === edit.id)
    )
      throw new Error(
        "Selesaikan sinkronisasi catatan ini sebelum mengubahnya lagi.",
      );
    await cache.pending.add(pending);
    return pending;
  });
}
const syncing = new Map<string, Promise<void>>();
export function syncEntities(cache: OperationsCache): Promise<void> {
  const previous = syncing.get(cache.accountId);
  if (previous) return previous;
  const task = (async () => {
    const session = await cloud?.auth.getSession();
    if (session?.data.session?.user.id !== cache.accountId)
      throw new Error("Masuk kembali sebelum menyinkronkan.");
    for (const item of await cache.pending.orderBy("createdAt").toArray()) {
      if (item.status !== "pending") continue;
      try {
        const saved = await api<Entity>("ops-save", {
          farmId: item.farmId,
          kind: item.kind,
          data: item.data,
          mutationId: item.id,
          id: item.entityId,
          version: item.version,
        });
        await cache.transaction(
          "rw",
          cache.entities,
          cache.pending,
          async () => {
            await cache.entities.put({ ...saved, kind: item.kind });
            await cache.pending.delete(item.id);
          },
        );
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Sinkronisasi belum berhasil.";
        if (/CONFLICT|telah berubah/.test(message)) {
          await cache.pending.update(item.id, {
            status: "conflict",
            error:
              "Catatan berubah di perangkat lain. Bandingkan sebelum mencoba lagi.",
          });
        } else {
          if (!navigator.onLine) throw e;
          await cache.pending.update(item.id, {
            status: "failed",
            error: message,
          });
        }
      }
    }
  })().finally(() => syncing.delete(cache.accountId));
  syncing.set(cache.accountId, task);
  return task;
}
export async function cachedRows(
  cache: OperationsCache,
  farmId: string,
  kind: string,
) {
  const stored = await cache.entities
    .where("[farm_id+kind]")
    .equals([farmId, kind])
    .toArray();
  const pending = (
    await cache.pending.where("farmId").equals(farmId).toArray()
  ).filter((p) => p.kind === kind);
  const merged = new Map(stored.map((r) => [r.id, r]));
  for (const p of pending)
    merged.set(p.entityId ?? p.id, {
      ...p.data,
      id: p.entityId ?? p.id,
      farm_id: farmId,
      kind,
      created_at: new Date(p.createdAt).toISOString(),
      mutation_id: p.id,
      version: p.version ?? 0,
    } as Cached);
  return [...merged.values()];
}
export async function refreshKind(
  cache: OperationsCache,
  farmId: string,
  kind: string,
) {
  const rows = await listEntities(farmId, kind);
  await cache.transaction("rw", cache.entities, async () => {
    await cache.entities
      .where("[farm_id+kind]")
      .equals([farmId, kind])
      .delete();
    await cache.entities.bulkPut(rows.map((r) => ({ ...r, kind })));
  });
  return cachedRows(cache, farmId, kind);
}
export async function saveDemo(
  cache: OperationsCache,
  farmId: string,
  kind: EntityKind,
  data: Record<string, unknown>,
  edit?: Entity,
) {
  const values = validateEntity(kind, data);
  data = {
    ...values,
    ...(data.pond_id ? { pond_id: data.pond_id } : {}),
    ...(data.cycle_id ? { cycle_id: data.cycle_id } : {}),
  };
  await cache.transaction("rw", cache.entities, cache.pending, async () => {
    if (edit) {
      const current = await cache.entities.get(edit.id);
      if (
        current?.farm_id !== farmId ||
        current?.kind !== kind ||
        current?.version !== edit.version
      )
        throw new Error("Catatan berubah. Muat ulang dahulu.");
    }
    if (kind === "feed") {
      const items = await cachedRows(cache, farmId, kind);
      const balance = items
        .filter(
          (r) =>
            r.pond_id === data.pond_id &&
            r.product === data.product &&
            r.id !== edit?.id,
        )
        .reduce(
          (s, r) =>
            s +
            (r.entry_type === "stock_in"
              ? Number(r.quantity_kg)
              : r.entry_type === "actual"
                ? -Number(r.quantity_kg)
                : 0),
          0,
        );
      if (
        balance +
          (data.entry_type === "stock_in"
            ? Number(data.quantity_kg)
            : data.entry_type === "actual"
              ? -Number(data.quantity_kg)
              : 0) <
        0
      )
        throw new Error("Stok pakan tidak mencukupi.");
    }
    const id = edit?.id ?? crypto.randomUUID();
    await cache.entities.put({
      ...data,
      id,
      farm_id: farmId,
      kind,
      created_at: edit?.created_at ?? new Date().toISOString(),
      mutation_id: crypto.randomUUID(),
      version: (edit?.version ?? 0) + 1,
    } as Cached);
  });
}
export async function seedDemo(
  cache: OperationsCache,
  farmId: string,
  pondId: string,
  details?: { name: string; areaM2: number },
) {
  await cache.transaction("rw", cache.entities, async () => {
    const existing = await cache.entities.get(pondId);
    const seeded = existing?.farm_id === farmId && existing.kind === "ponds";
    const now = new Date();
    const iso = now.toISOString();
    const day = iso.slice(0, 10);
    const row = (kind: string, data: Record<string, unknown>) => ({
      ...data,
      id: crypto.randomUUID(),
      farm_id: farmId,
      pond_id: pondId,
      kind,
      mutation_id: crypto.randomUUID(),
      version: 1,
      created_at: iso,
    });
    const rows: Cached[] = [
      {
        ...row("ponds", {
          name:
            details?.name ?? (pondId === "pond-b" ? "Kolam B" : "Kolam contoh"),
          area_m2: details?.areaM2 ?? 2000,
          depth_m: 1.3,
          system: "biofloc",
        }),
        id: pondId,
      },
      row("cycles", {
        name: "Siklus contoh",
        started_on: day,
        stock_count: 100000,
      }),
      row("feed", {
        product: "Pakan pembesaran",
        entry_type: "stock_in",
        quantity_kg: 200,
        scheduled_at: iso,
        note: "Stok contoh",
      }),
      row("feed", {
        product: "Pakan pembesaran",
        entry_type: "plan",
        quantity_kg: 24,
        scheduled_at: iso,
        note: "Rencana hari ini",
      }),
      row("feed", {
        product: "Pakan pembesaran",
        entry_type: "actual",
        quantity_kg: 23,
        scheduled_at: iso,
        note: "Realisasi contoh",
      }),
      row("costs", {
        title: "Pakan",
        category: "feed",
        amount: 350000,
        occurred_on: day,
      }),
      row("energy", {
        kwh: 18.4,
        started_at: new Date(now.getTime() - 86400000).toISOString(),
        ended_at: iso,
        meter: "Meter contoh",
      }),
      row("biofloc", {
        activity: "observation",
        quantity: 12,
        unit: "mL/L",
        note: "Contoh pengamatan SV30; verifikasi dengan uji ulang.",
        measured_at: iso,
      }),
      row("schedules", {
        parameter: "sv30",
        interval_hours: 24,
        reference: "Contoh jadwal; sesuaikan SOP kolam",
      }),
      row("configurations", {
        name: "Survei awal contoh",
        aerator: "Aerator kolam; kapasitas menunggu pemeriksaan",
        electricity: "Proteksi dan daya perlu diperiksa di lokasi",
        connectivity: "PondHub bersama; jangkauan belum diuji",
        node_count: 1,
        compatibility: "not_assessed",
        note: "Rancangan demo. Belum ada persetujuan instalasi fisik.",
      }),
      row("services", {
        title: "Kalibrasi dan pemeriksaan sensor",
        service_type: "calibration",
        status: "requested",
        note: "Permintaan contoh untuk pendamping. Tidak dikirim ke tim layanan.",
      }),
    ] as Cached[];
    for (const [key, value] of Object.entries({
      dissolvedOxygen: 5.5,
      ph: 7.8,
      temperature: 29,
      ammonia: 0.08,
      nitrite: 0.03,
      alkalinity: 130,
      sv30: 12,
    }))
      rows.push(
        row("measurements", {
          parameter: key,
          value,
          source: ["dissolvedOxygen", "ph", "temperature"].includes(key)
            ? "sensor"
            : "manual",
          quality: "valid",
          measured_at: iso,
          method: "Data simulasi",
        }) as Cached,
      );
    for (const [parameter, min, max, critMin, critMax] of [
      ["dissolvedOxygen", 4, 8, 3, 12],
      ["ph", 7, 8.5, 6, 9],
      ["temperature", 26, 32, 23, 35],
    ] as const)
      rows.push(
        row("thresholds", {
          parameter,
          minimum: min,
          maximum: max,
          critical_minimum: critMin,
          critical_maximum: critMax,
          max_age_minutes: 180,
          reference: "Acuan contoh demo, bukan SOP universal",
        }) as Cached,
      );
    const cycle = rows.find((r) => r.kind === "cycles");
    for (const record of rows)
      if (
        ![
          "ponds",
          "cycles",
          "thresholds",
          "probes",
          "calibrations",
          "schedules",
          "configurations",
          "services",
        ].includes(record.kind) &&
        record.entry_type !== "stock_in"
      )
        record.cycle_id = cycle?.id;
    if (seeded) {
      // Upgrade example coverage without overwriting user measurements or notes.
      for (const kind of ["schedules", "configurations", "services"]) {
        const exists = await cache.entities
          .where("[farm_id+kind]")
          .equals([farmId, kind])
          .and((r) => r.pond_id === pondId)
          .count();
        if (!exists)
          await cache.entities.bulkPut(rows.filter((r) => r.kind === kind));
      }
    } else await cache.entities.bulkPut(rows);
  });
}
export const canWrite = (kind: EntityKind, role: string) => {
  if (!["owner", "operator", "pondivator", "admin"].includes(role))
    return false;
  const d: Definition = definitions[kind];
  return (
    role === "admin" ||
    (d.owner ? role === "owner" : d.roles ? d.roles.includes(role) : true)
  );
};

export async function resetDemoOperations(accountId: string) {
  if (!accountId?.trim()) throw new Error("Masuk kembali sebelum mengatur ulang data demo.");
  const cache = new OperationsCache(accountId);
  try {
    await cache.transaction("rw", cache.entities, cache.pending, async () => {
      await cache.entities.clear();
      await cache.pending.clear();
    });
    for (const key of Object.keys(localStorage))
      if (key.startsWith(`tambaqu:aeration:demo:${encodeURIComponent(accountId)}:`))
        localStorage.removeItem(key);
  } finally {
    cache.close();
  }
}
