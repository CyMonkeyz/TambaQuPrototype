import { subscribeDemoRepository } from "../../data/repositories/mock";
import { isDataConnectionAvailable, useConnectivityStore } from "../../store/connectivity-store";
import { refreshSyncCounts } from "../sync/outboxRepository";
import { syncPendingMutations } from "../sync/syncManager";
import { initializeOfflineDatabase, persistRemoteSnapshot } from "./persistenceService";

let initialized = false;
let unsubscribeRepository: (() => void) | null = null;
let refreshPromise: Promise<void> | null = null;

function refreshLocalFromRemote() {
  if (refreshPromise || !isDataConnectionAvailable()) return;
  const { pendingCount } = useConnectivityStore.getState();
  if (pendingCount > 0) return;
  refreshPromise = persistRemoteSnapshot()
    .catch(() => useConnectivityStore.getState().setHydration("error", false))
    .finally(() => {
      refreshPromise = null;
    });
}

export async function initializeOfflineRuntime() {
  if (initialized) return;
  initialized = true;
  try {
    const available = await initializeOfflineDatabase();
    if (!available) return;
    await refreshSyncCounts();
    unsubscribeRepository = subscribeDemoRepository(refreshLocalFromRemote);
    if (isDataConnectionAvailable()) {
      await syncPendingMutations();
      refreshLocalFromRemote();
    }
  } catch {
    useConnectivityStore.getState().setHydration("error", false);
  }
}

export function disposeOfflineRuntime() {
  unsubscribeRepository?.();
  unsubscribeRepository = null;
  initialized = false;
}
