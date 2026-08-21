import { useEffect } from "react";
import { initializeOfflineRuntime } from "../../services/offline/offlineRuntime";
import { syncPendingMutations } from "../../services/sync/syncManager";
import {
  isDataConnectionAvailable,
  useConnectivityStore,
} from "../../store/connectivity-store";

export function OfflineRuntime() {
  const demoOverride = useConnectivityStore((state) => state.demoOverride);
  const browserOnline = useConnectivityStore((state) => state.browserOnline);
  const setBrowserOnline = useConnectivityStore((state) => state.setBrowserOnline);

  useEffect(() => {
    void initializeOfflineRuntime();
    const online = () => {
      setBrowserOnline(true);
      void syncPendingMutations();
    };
    const offline = () => setBrowserOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [setBrowserOnline]);

  useEffect(() => {
    if (isDataConnectionAvailable()) void syncPendingMutations();
  }, [browserOnline, demoOverride]);

  return null;
}
