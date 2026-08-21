import type { ReactNode } from "react";
import { ToastProvider } from "../../components/ui/Toast";
import { OfflineRuntime } from "../../components/offline/OfflineRuntime";
import { PwaLifecycle } from "../../components/pwa/PwaLifecycle";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <OfflineRuntime />
      <PwaLifecycle />
      <ToastProvider />
    </>
  );
}
