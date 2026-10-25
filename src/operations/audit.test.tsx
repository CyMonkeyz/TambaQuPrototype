// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DemoPreview } from "./DemoPreview";
import { BioflocSummary } from "./BioflocSummary";
import {
  OperationsCache,
  seedDemo,
  cachedRows,
  saveDemo,
  resetDemoOperations,
} from "./repository";
import { CultivationPage } from "../pages/Services/CultivationPage";
import { EntityPanel } from "./EntityPanel";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it("resets only the active local account and its aerator storage", async () => {
  const demo = new OperationsCache("audit-active-local"),
    account = new OperationsCache("audit-real-account");
  try {
    await seedDemo(demo, "farm", "pond-demo");
    await seedDemo(account, "farm-real", "pond-real");
    localStorage.setItem("tambaqu:aeration:demo:audit-active-local:farm:pond-demo", "{}");
    localStorage.setItem("tambaqu:aeration:demo:other-account:farm:pond-demo", "keep");
    localStorage.setItem("other-user-preference", "keep");
    await resetDemoOperations("audit-active-local");
    expect(await demo.entities.count()).toBe(0);
    expect(await account.entities.count()).toBeGreaterThan(0);
    expect(
      localStorage.getItem("tambaqu:aeration:demo:audit-active-local:farm:pond-demo"),
    ).toBeNull();
    expect(localStorage.getItem("other-user-preference")).toBe("keep");
    expect(localStorage.getItem("tambaqu:aeration:demo:other-account:farm:pond-demo")).toBe("keep");
  } finally {
    await demo.delete();
    await account.delete();
  }
});
it("retains the original cycle when editing from the all-cycles view", async () => {
  const onSave = vi.fn(
    async (_kind: string, _data: Record<string, unknown>) => {},
  );
  render(
    <EntityPanel
      kind="feed"
      pondId="pond-a"
      cycleId=""
      allowed
      onSave={onSave}
      rows={[
        {
          id: "record",
          farm_id: "farm",
          pond_id: "pond-a",
          cycle_id: "existing-cycle",
          version: 1,
          mutation_id: "m",
          created_at: new Date().toISOString(),
          product: "Pakan",
          entry_type: "actual",
          quantity_kg: 1,
          scheduled_at: new Date().toISOString(),
          note: "Catatan",
        },
      ]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /^Ubah Pakan$/ }));
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan catatan" }).closest("form")!,
  );
  expect(onSave.mock.calls[0]?.[1]).toMatchObject({
    cycle_id: "existing-cycle",
    pond_id: "pond-a",
  });
});
it("exposes every proposal module from the feature directory", () => {
  render(
    <MemoryRouter>
      <CultivationPage />
    </MemoryRouter>,
  );
  for (const id of [
    "biofloc",
    "aeration",
    "feed",
    "weather",
    "profit",
    "config",
    "visits",
    "billing",
    "team",
  ])
    expect(document.querySelector(`a[href='/app/modules/${id}']`)).toBeTruthy();
});
it("persists aeration by pond and never restarts after resetting an interlock", () => {
  const props = { farmId: "audit-farm", pondId: "pond-a", pondName: "Kolam A" };
  const view = render(<DemoPreview kind="aeration" {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Coba nyalakan" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Coba gangguan pengaman" }),
  );
  expect(
    (screen.getByRole("button", { name: "Coba nyalakan" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  view.unmount();
  const next = render(<DemoPreview kind="aeration" {...props} />);
  expect(
    screen.getByRole("heading", { name: "Dihentikan pengaman" }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Pulihkan pengaman contoh" }),
  );
  expect(screen.getByRole("heading", { name: "Siap dicoba" })).toBeTruthy();
  next.rerender(
    <DemoPreview
      kind="aeration"
      {...props}
      pondId="pond-b"
      pondName="Kolam B"
    />,
  );
  expect(
    screen.getByText("Belum ada tindakan. Coba nyalakan aerator di atas."),
  ).toBeTruthy();
});
it("does not substitute unmeasured biofloc values with zero", () => {
  render(<BioflocSummary measurements={[]} />);
  expect(screen.getAllByText("Belum diukur")).toHaveLength(6);
  expect(screen.queryByText("0")).toBeNull();
});
it("adds demo ponds without resetting existing actions and serializes feed consumption", async () => {
  const db = new OperationsCache("audit-seeding");
  try {
    await seedDemo(db, "farm", "pond-a", { name: "Kolam A", areaM2: 1800 });
    await saveDemo(db, "farm", "actions", {
      pond_id: "pond-a",
      title: "Catatan lama",
      status: "done",
      note: "Tetap ada",
    });
    await seedDemo(db, "farm", "pond-b", { name: "Kolam B", areaM2: 2000 });
    expect(
      (await cachedRows(db, "farm", "ponds")).map((p) => p.name).sort(),
    ).toEqual(["Kolam A", "Kolam B"]);
    expect((await cachedRows(db, "farm", "actions"))[0].note).toBe("Tetap ada");
    const data = {
      pond_id: "pond-a",
      product: "Pakan pembesaran",
      entry_type: "actual",
      quantity_kg: 100,
      scheduled_at: new Date().toISOString(),
      note: "Uji bersamaan",
    };
    const results = await Promise.allSettled([
      saveDemo(db, "farm", "feed", data),
      saveDemo(db, "farm", "feed", data),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  } finally {
    await db.delete();
  }
});
