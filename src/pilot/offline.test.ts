// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), user: "user-a" }));
vi.mock("./client", () => ({
  saveRecord: mocks.save,
  cloud: {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: mocks.user } } },
      }),
    },
  },
}));
import { PilotCache, queueRecord, syncPilot } from "./offline";
const opened: PilotCache[] = [];
afterEach(async () => {
  for (const db of opened.splice(0)) await db.delete();
  mocks.save.mockReset();
  mocks.user = "user-a";
});
describe("pilot isolation and sync", () => {
  it("keeps accounts in separate databases and deduplicates concurrent synchronization", async () => {
    const a = new PilotCache("user-a"),
      b = new PilotCache("user-b");
    opened.push(a, b);
    await queueRecord(a, {
      farmId: "farm-a",
      kind: "action",
      data: { note: "Periksa aerasi" },
    });
    expect(await b.pending.count()).toBe(0);
    expect(await b.records.count()).toBe(0);
    mocks.save.mockResolvedValue({});
    await Promise.all([syncPilot(a, "user-a"), syncPilot(a, "user-a")]);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(await a.pending.count()).toBe(0);
  });
  it("preserves unsynced changes after a failed request", async () => {
    const a = new PilotCache("user-a");
    opened.push(a);
    await queueRecord(a, {
      farmId: "farm-a",
      kind: "action",
      data: { note: "Periksa" },
    });
    mocks.save.mockRejectedValue(new Error("offline"));
    await expect(syncPilot(a, "user-a")).rejects.toThrow("offline");
    expect(await a.pending.count()).toBe(1);
    expect(await a.records.count()).toBe(1);
  });
  it("does not replay another account queue after session change", async () => {
    const a = new PilotCache("user-a");
    opened.push(a);
    await queueRecord(a, { farmId: "farm-a", kind: "action", data: {} });
    mocks.user = "user-b";
    await expect(syncPilot(a, "user-a")).rejects.toThrow("Masuk kembali");
    expect(mocks.save).not.toHaveBeenCalled();
    expect(await a.pending.count()).toBe(1);
  });
});
