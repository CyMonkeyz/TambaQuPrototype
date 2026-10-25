import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { EntryRoute, DemoEntry, RegisteredGuard } from "./EntryRoutes";
import { ServicesPage } from "../../pages/Services/ServicesPage";
import { CultivationPage } from "../../pages/Services/CultivationPage";
import { AppShell } from "../../components/layout/AppShell";
import { DashboardPage } from "../../pages/Dashboard/DashboardPage";
import { LoginPage } from "../../pages/Login/LoginPage";
import { NotFoundPage } from "../../pages/NotFound/NotFoundPage";
import { LoadingSkeleton } from "../../components/ui/Feedback";
import { loadWithRecovery } from "../../utils/lazyWithRecovery";
import { useLocalSession } from "../../services/localAuth";

const BillingPage = lazy(() => import("../../pages/Billing/BillingPage").then(m => ({ default:m.BillingPage })));
const DemoModules = lazy(() =>
  loadWithRecovery(() => import("../../operations/Workspace")).then((m) => ({
    default: m.OperationsWorkspace,
  })),
);

const PondsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Ponds/PondsPage")).then(
    (module) => ({
      default: module.PondsPage,
    }),
  ),
);
const PondDetailPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/PondDetail/PondDetailPage")).then(
    (module) => ({
      default: module.PondDetailPage,
    }),
  ),
);
const PondBrainPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/PondBrain/PondBrainPage")).then(
    (module) => ({
      default: module.PondBrainPage,
    }),
  ),
);
const AlertsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Alerts/AlertsPage")).then(
    (module) => ({
      default: module.AlertsPage,
    }),
  ),
);
const ReportsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Reports/ReportsPage")).then(
    (module) => ({
      default: module.ReportsPage,
    }),
  ),
);
const DevicesPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Devices/DevicesPage")).then(
    (module) => ({
      default: module.DevicesPage,
    }),
  ),
);
const SettingsPage = lazy(() =>
  loadWithRecovery(() => import("../../pages/Settings/SettingsPage")).then(
    (module) => ({
      default: module.SettingsPage,
    }),
  ),
);
const DemoControlPage = lazy(() =>
  loadWithRecovery(
    () => import("../../pages/DemoControl/DemoControlPage"),
  ).then((module) => ({
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

function BillingRoute() {
  const { session } = useLocalSession();
  return session ? <DeferredRoute><BillingPage userId={session.user.id} /></DeferredRoute> : <LoadingSkeleton rows={3} />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <DeferredRoute>
            <EntryRoute />
          </DeferredRoute>
        }
      />
      <Route
        path="/demo"
        element={
          <DeferredRoute>
            <DemoEntry />
          </DeferredRoute>
        }
      />
      <Route
        path="/expo"
        element={
          <DeferredRoute>
            <DemoEntry />
          </DeferredRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/pilot/:section?"
        element={
          <DeferredRoute>
            <DemoEntry />
          </DeferredRoute>
        }
      />
      <Route
        path="/pilot-demo/:section?"
        element={<Navigate to="/demo" replace />}
      />
      <Route element={<RegisteredGuard />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="billing" element={<BillingRoute />} />
          <Route path="cultivation" element={<CultivationPage />} />
          <Route path="modules/billing" element={<Navigate to="/app/billing" replace />} />
          <Route
            path="modules/:section"
            element={
              <DeferredRoute>
                <DemoModules demo />
              </DeferredRoute>
            }
          />
          <Route
            path="ponds"
            element={
              <DeferredRoute>
                <PondsPage />
              </DeferredRoute>
            }
          />
          <Route
            path="ponds/:pondId"
            element={
              <DeferredRoute>
                <PondDetailPage />
              </DeferredRoute>
            }
          />
          <Route
            path="pondbrain"
            element={
              <DeferredRoute>
                <PondBrainPage />
              </DeferredRoute>
            }
          />
          <Route
            path="alerts"
            element={
              <DeferredRoute>
                <AlertsPage />
              </DeferredRoute>
            }
          />
          <Route
            path="reports"
            element={
              <DeferredRoute>
                <ReportsPage />
              </DeferredRoute>
            }
          />
          <Route
            path="devices"
            element={
              <DeferredRoute>
                <DevicesPage />
              </DeferredRoute>
            }
          />
          <Route
            path="settings"
            element={
              <DeferredRoute>
                <SettingsPage />
              </DeferredRoute>
            }
          />
          <Route
            path="demo-control"
            element={
              <DeferredRoute>
                <DemoControlPage />
              </DeferredRoute>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
