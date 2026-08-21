import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { DashboardPage } from "../../pages/Dashboard/DashboardPage";
import { LoginPage } from "../../pages/Login/LoginPage";
import { NotFoundPage } from "../../pages/NotFound/NotFoundPage";
import { LoadingSkeleton } from "../../components/ui/Feedback";
import { useAppStore } from "../../store/app-store";
import { loadWithRecovery } from "../../utils/lazyWithRecovery";

const PondsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Ponds/PondsPage")).then((module) => ({
    default: module.PondsPage,
  })),
);
const PondDetailPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/PondDetail/PondDetailPage")).then((module) => ({
    default: module.PondDetailPage,
  })),
);
const PondBrainPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/PondBrain/PondBrainPage")).then((module) => ({
    default: module.PondBrainPage,
  })),
);
const AlertsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Alerts/AlertsPage")).then((module) => ({
    default: module.AlertsPage,
  })),
);
const ReportsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Reports/ReportsPage")).then((module) => ({
    default: module.ReportsPage,
  })),
);
const DevicesPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Devices/DevicesPage")).then((module) => ({
    default: module.DevicesPage,
  })),
);
const SettingsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Settings/SettingsPage")).then((module) => ({
    default: module.SettingsPage,
  })),
);
const DemoControlPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/DemoControl/DemoControlPage")).then((module) => ({
    default: module.DemoControlPage,
  })),
);

function DeferredRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton rows={4} label="Memuat halaman" />}>
      {children}
    </Suspense>
  );
}

function SessionGuard() {
  const hasSession = useAppStore((state) =>
    Boolean(state.activeUser && state.activeFarm),
  );
  return hasSession ? <Outlet /> : <Navigate to="/login" replace />;
}

function RootRedirect() {
  const hasSession = useAppStore((state) =>
    Boolean(state.activeUser && state.activeFarm),
  );
  return <Navigate to={hasSession ? "/app/dashboard" : "/login"} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<SessionGuard />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="ponds" element={<DeferredRoute><PondsPage /></DeferredRoute>} />
          <Route path="ponds/:pondId" element={<DeferredRoute><PondDetailPage /></DeferredRoute>} />
          <Route path="pondbrain" element={<DeferredRoute><PondBrainPage /></DeferredRoute>} />
          <Route path="alerts" element={<DeferredRoute><AlertsPage /></DeferredRoute>} />
          <Route path="reports" element={<DeferredRoute><ReportsPage /></DeferredRoute>} />
          <Route path="devices" element={<DeferredRoute><DevicesPage /></DeferredRoute>} />
          <Route path="settings" element={<DeferredRoute><SettingsPage /></DeferredRoute>} />
          <Route path="demo-control" element={<DeferredRoute><DemoControlPage /></DeferredRoute>} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
