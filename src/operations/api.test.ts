import { describe, it, expect, vi } from "vitest";
import {
  operations,
  deviceV2,
} from "../../supabase/functions/pilot-api/operations";
const user = "11111111-1111-4111-8111-111111111111",
  farm = "22222222-2222-4222-8222-222222222222",
  pond = "33333333-3333-4333-8333-333333333333";
function database(role: string | null, fixtures: Record<string, unknown> = {}) {
  const rpc = vi.fn(async (_name: string, _args: Record<string, unknown>) => ({
    data: { id: "saved" },
    error: null,
  }));
  const calls: { table: string; filters: Record<string, unknown> }[] = [];
  return {
    rpc,
    calls,
    from(table: string) {
      const filters: Record<string, unknown> = {};
      calls.push({ table, filters });
      const data = Object.hasOwn(fixtures, table)
        ? fixtures[table]
        : table === "memberships"
          ? role
            ? { role }
            : null
          : null;
      const response = () => ({ data, error: null });
      const q: any = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return q;
        },
        single: async () => response(),
        maybeSingle: async () => response(),
        update: () => q,
        insert: () => q,
        order: () => q,
        range: async () => response(),
      };
      return q;
    },
  };
}
describe("edge authorization without external services", () => {
  it("rejects a nonmember even when the payload claims administrator", async () => {
    const db = database(null);
    await expect(
      operations(db, user, {
        operation: "ops-save",
        farmId: farm,
        admin: true,
        role: "owner",
        kind: "ponds",
      }),
    ).rejects.toThrow("Akses tambak");
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("rejects finance reads and owner configuration writes by an operator", async () => {
    const db = database("operator");
    await expect(
      operations(db, user, {
        operation: "ops-list",
        farmId: farm,
        kind: "costs",
      }),
    ).rejects.toThrow("pemilik");
    await expect(
      operations(db, user, {
        operation: "ops-save",
        farmId: farm,
        kind: "thresholds",
      }),
    ).rejects.toThrow("pemilik");
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("takes farm and actor from the checked context rather than record fields", async () => {
    const db = database("operator");
    await operations(db, user, {
      operation: "ops-save",
      farmId: farm,
      kind: "actions",
      mutationId: crypto.randomUUID(),
      data: {
        pond_id: pond,
        title: "Ukur ulang",
        status: "done",
        note: "Catatan",
        created_by: "other",
        farm_id: "other",
      },
    });
    const args = db.rpc.mock.calls[0];
    expect(args[1].p_actor).toBe(user);
    expect(args[1].p_farm).toBe(farm);
    expect(args[1].p_data).not.toHaveProperty("created_by");
    expect(args[1].p_data).not.toHaveProperty("farm_id");
  });
  it("does not let an owner forge completion of a technician visit", async () => {
    const db = database("owner");
    await expect(
      operations(db, user, {
        operation: "ops-save",
        farmId: farm,
        kind: "services",
        mutationId: crypto.randomUUID(),
        data: {
          pond_id: pond,
          title: "Survei",
          service_type: "survey",
          status: "completed",
          note: "Done",
          checklist: "Forged",
        },
      }),
    ).rejects.toThrow("petugas");
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("does not expose admin status from user-controlled metadata", async () => {
    const db = database(null);
    expect(
      await operations(db, user, { operation: "ops-admin", admin: true }),
    ).toEqual({ enabled: false });
  });
  it("rejects relay from an unlinked gateway before ingest", async () => {
    const node = crypto.randomUUID();
    const db = database(null, {
      devices: {
        id: node,
        farm_id: farm,
        operational_pond_id: pond,
        device_type: "sensor_node",
      },
      op_node_links: null,
    });
    await expect(
      deviceV2(
        db,
        { id: crypto.randomUUID(), device_type: "pond_hub" },
        {
          schemaVersion: 2,
          messageId: crypto.randomUUID(),
          nodeId: node,
          measuredAt: new Date().toISOString(),
          firmwareVersion: "test",
          measurements: [
            {
              probeId: crypto.randomUUID(),
              parameter: "ph",
              value: 7.8,
              quality: "unverified",
            },
          ],
        },
      ),
    ).rejects.toThrow("gateway");
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
