import { create } from "zustand";
import type {
  DemoConnectivityOverride,
  HydrationState,
  SyncState,
} from "../domain/offline";

interface ConnectivityState {
  browserOnline: boolean;
  demoOverride: DemoConnectivityOverride;
  syncState: SyncState;
  hydrationState: HydrationState;
  storageAvailable: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
  lastSyncMessage: string | null;
  setBrowserOnline: (online: boolean) => void;
  setDemoOverride: (override: DemoConnectivityOverride) => void;
  setSyncState: (state: SyncState, message?: string | null) => void;
  setHydration: (state: HydrationState, storageAvailable: boolean) => void;
  setSyncCounts: (pending: number, failed: number) => void;
  markSynced: (timestamp: string, message: string) => void;
}

const initialBrowserOnline =
  typeof navigator === "undefined" ? true : navigator.onLine;

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  browserOnline: initialBrowserOnline,
  demoOverride: "auto",
  syncState: "idle",
  hydrationState: "initializing",
  storageAvailable: true,
  pendingCount: 0,
  failedCount: 0,
  lastSyncedAt: null,
  lastSyncMessage: null,
  setBrowserOnline: (browserOnline) => set({ browserOnline }),
  setDemoOverride: (demoOverride) => set({ demoOverride }),
  setSyncState: (syncState, lastSyncMessage = null) =>
    set({ syncState, lastSyncMessage }),
  setHydration: (hydrationState, storageAvailable) =>
    set({ hydrationState, storageAvailable }),
  setSyncCounts: (pendingCount, failedCount) =>
    set({ pendingCount, failedCount }),
  markSynced: (lastSyncedAt, lastSyncMessage) =>
    set({ syncState: "idle", lastSyncedAt, lastSyncMessage }),
}));

export function getEffectiveConnectivity() {
  const state = useConnectivityStore.getState();
  if (state.demoOverride !== "auto") return state.demoOverride;
  return state.browserOnline ? "online" : "offline";
}

export function isDataConnectionAvailable() {
  return getEffectiveConnectivity() !== "offline";
}
