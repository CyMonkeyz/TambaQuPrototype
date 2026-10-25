// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { it, expect, vi, afterEach } from "vitest";
import {
  OperationsCache,
  seedDemo,
  cachedRows,
  saveDemo,
  queueEntity,
  syncEntities,
} from "./repository";
import { api } from "../pilot/client";
vi.mock("../pilot/client", () => ({
  cloud: {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "account-a" } } },
      }),
    },
  },
  api: vi.fn(),
}));
const databases: OperationsCache[] = [];
const cache = (account: string) => {
  const db = new OperationsCache(account);
  databases.push(db);
  return db;
};
afterEach(async () => {
  for (const db of databases.splice(0)) await db.delete();
  vi.clearAllMocks();
});
it("seeds once under concurrent requests and retains demo actions", async () => {
  const db = cache("demo-test");
  await Promise.all([
    seedDemo(db, "farm", "pond"),
    seedDemo(db, "farm", "pond"),
  ]);
  expect((await cachedRows(db, "farm", "ponds")).length).toBe(1);
  expect((await cachedRows(db, "farm", "feed")).length).toBe(3);
  await saveDemo(db, "farm", "actions", {
    pond_id: "pond",
    title: "Tindakan",
    status: "done",
    note: "Ukur ulang",
  });
  await seedDemo(db, "farm", "pond");
  expect((await cachedRows(db, "farm", "actions")).length).toBe(1);
});
it("keeps accounts isolated and blocks excess feed use", async () => {
  const a = cache("account-a"),
    b = cache("account-b");
  await seedDemo(a, "farm", "pond");
  expect(await cachedRows(b, "farm", "feed")).toHaveLength(0);
  await expect(
    saveDemo(a, "farm", "feed", {
      pond_id: "pond",
      product: "Pakan pembesaran",
      entry_type: "actual",
      quantity_kg: 999,
      scheduled_at: new Date().toISOString(),
      note: "Over",
    }),
  ).rejects.toThrow("Stok");
});
it("retains local input on conflicts and removes it only after successful retry", async () => {
  const db = cache("account-a");
  const edit = {
    id: "id",
    farm_id: "farm",
    version: 1,
    created_at: new Date().toISOString(),
    mutation_id: "mutation",
  };
  const pending = await queueEntity(
    db,
    "farm",
    "actions",
    { pond_id: "pond", title: "Local", status: "done", note: "Keep" },
    edit,
  );
  vi.mocked(api).mockRejectedValueOnce(
    new Error("CONFLICT: Catatan telah berubah."),
  );
  await syncEntities(db);
  expect((await db.pending.get(pending.id))?.status).toBe("conflict");
  expect((await cachedRows(db, "farm", "actions"))[0].note).toBe("Keep");
  await db.pending.update(pending.id, { version: 2, status: "pending" });
  vi.mocked(api).mockResolvedValueOnce({
    ...edit,
    title: "Local",
    note: "Keep",
    version: 3,
  });
  await syncEntities(db);
  expect(await db.pending.count()).toBe(0);
  expect((await cachedRows(db, "farm", "actions"))[0].version).toBe(3);
});
