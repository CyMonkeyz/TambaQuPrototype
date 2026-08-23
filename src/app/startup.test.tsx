// @vitest-environment jsdom

import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import Dexie from "dexie";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router";
import { AppErrorBoundary } from "../components/common/AppErrorBoundary";
import { demoFarm, demoUser } from "../data/mock/fixtures";
import { disposeOfflineRuntime } from "../services/offline/offlineRuntime";
import { TambaQuDatabase } from "../services/offline/db";
import { resetOfflineDataFromRemote } from "../services/offline/persistenceService";
import { useAppStore, normalizePersistedSession } from "../store/app-store";
import { useConnectivityStore } from "../store/connectivity-store";

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

class ResizeObserverStub {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 1024,
            height: 300,
          } as DOMRectReadOnly,
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  Element.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({
      width: 1024,
      height: 300,
      top: 0,
      left: 0,
      right: 1024,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
});

beforeEach(async () => {
  localStorage.clear();
  useAppStore.setState({
    activeUser: demoUser,
    activeFarm: demoFarm,
    selectedPondId: "pond-b",
    sidebarCollapsed: false,
    demoMode: true,
  });
  useConnectivityStore.setState({
    browserOnline: true,
    demoOverride: "online",
    syncState: "idle",
    hydrationState: "initializing",
    storageAvailable: true,
  });
  await resetOfflineDataFromRemote();
});

afterEach(() => {
  cleanup();
  disposeOfflineRuntime();
});

describe("startup regression", () => {
  it("keeps the dashboard rendered after asynchronous hydration", async () => {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <AppProviders>
          <AppRouter />
        </AppProviders>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Ringkasan Operasional", {}, { timeout: 25_000 }),
    ).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect(screen.getByText("Ringkasan Operasional")).toBeTruthy();
    expect(screen.queryByText("TambaQu mengalami kendala.")).toBeNull();
  }, 30_000);

  it("normalizes an incompatible persisted session instead of booting it", () => {
    expect(
      normalizePersistedSession({
        activeUser: { id: "legacy-user" },
        activeFarm: { id: "legacy-farm" },
        selectedPondId: "removed-pond",
        demoMode: true,
      }),
    ).toMatchObject({
      activeUser: null,
      activeFarm: null,
      selectedPondId: null,
      demoMode: false,
    });
  });

  it("shows a recoverable screen when a render domain throws", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    function BrokenDomain(): never {
      throw new Error("render regression fixture");
    }
    render(
      <AppErrorBoundary>
        <BrokenDomain />
      </AppErrorBoundary>,
    );
    expect(screen.getByText("TambaQu mengalami kendala.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba Muat Ulang" })).toBeTruthy();
    consoleError.mockRestore();
  });
});

describe("IndexedDB schema migration", () => {
  it("invalidates legacy cached snapshots while preserving pending mutations", async () => {
    const databaseName = "TambaQuStartupMigration";
    await Dexie.delete(databaseName);
    const legacy = new Dexie(databaseName);
    legacy.version(1).stores({
      farms: "id",
      ponds: "id,farmId",
      sensorReadings: "id,pondId,timestamp,[pondId+timestamp]",
      riskAssessments: "id,pondId,timestamp",
      alerts: "id,pondId,status,timestamp",
      recommendations: "id,riskAssessmentId",
      actionLogs: "id,pondId,performedAt,syncStatus",
      devices: "id,pondId,connectionStatus,healthStatus",
      outbox: "id,&clientMutationId,entityType,entityId,operation,status,createdAt",
      syncMeta: "key",
    });
    await legacy.open();
    await legacy.table("riskAssessments").put({
      id: "legacy-risk",
      pondId: "pond-b",
      timestamp: "2026-01-01T00:00:00.000Z",
      score: 42,
    });
    await legacy.table("syncMeta").put({ key: "initialized", value: "true" });
    await legacy.table("outbox").put({
      id: "pending-legacy",
      clientMutationId: "pending-legacy-client",
      entityType: "actionLog",
      entityId: "legacy-action",
      operation: "ACTION_LOG_CREATE",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
      attemptCount: 0,
      payload: {},
    });
    legacy.close();

    const migrated = new TambaQuDatabase(databaseName);
    await migrated.open();
    expect(await migrated.riskAssessments.count()).toBe(0);
    expect(await migrated.syncMeta.count()).toBe(0);
    expect(await migrated.outbox.get("pending-legacy")).toBeTruthy();
    migrated.close();
    await Dexie.delete(databaseName);
  });
});
