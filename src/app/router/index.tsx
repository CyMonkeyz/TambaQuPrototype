import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { AlertsPage } from '../../pages/Alerts/AlertsPage'
import { DashboardPage } from '../../pages/Dashboard/DashboardPage'
import { DevicesPage } from '../../pages/Devices/DevicesPage'
import { LoginPage } from '../../pages/Login/LoginPage'
import { NotFoundPage } from '../../pages/NotFound/NotFoundPage'
import { PondBrainPage } from '../../pages/PondBrain/PondBrainPage'
import { PondDetailPage } from '../../pages/PondDetail/PondDetailPage'
import { PondsPage } from '../../pages/Ponds/PondsPage'
import { ReportsPage } from '../../pages/Reports/ReportsPage'
import { SettingsPage } from '../../pages/Settings/SettingsPage'
import { useAppStore } from '../../store/app-store'

function SessionGuard() {
  const hasSession = useAppStore((state) => Boolean(state.activeUser && state.activeFarm))
  return hasSession ? <Outlet/> : <Navigate to="/login" replace/>
}

function RootRedirect() {
  const hasSession = useAppStore((state) => Boolean(state.activeUser && state.activeFarm))
  return <Navigate to={hasSession ? '/app/dashboard' : '/login'} replace/>
}

export function AppRouter() {
  return <Routes><Route path="/" element={<RootRedirect/>}/><Route path="/login" element={<LoginPage/>}/><Route element={<SessionGuard/>}><Route path="/app" element={<AppShell/>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<DashboardPage/>}/><Route path="ponds" element={<PondsPage/>}/><Route path="ponds/:pondId" element={<PondDetailPage/>}/><Route path="pondbrain" element={<PondBrainPage/>}/><Route path="alerts" element={<AlertsPage/>}/><Route path="reports" element={<ReportsPage/>}/><Route path="devices" element={<DevicesPage/>}/><Route path="settings" element={<SettingsPage/>}/></Route></Route><Route path="*" element={<NotFoundPage/>}/></Routes>
}
