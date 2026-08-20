import { Bell, BrainCircuit, Droplets, LayoutDashboard, RadioTower, Settings, FileChartColumn } from 'lucide-react'

export const desktopNavigation = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Ponds', href: '/app/ponds', icon: Droplets },
  { label: 'PondBrain', href: '/app/pondbrain', icon: BrainCircuit },
  { label: 'Alerts', href: '/app/alerts', icon: Bell },
  { label: 'Reports', href: '/app/reports', icon: FileChartColumn },
  { label: 'Devices', href: '/app/devices', icon: RadioTower },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

export const mobilePrimaryNavigation = desktopNavigation.slice(0, 4)
export const mobileMoreNavigation = desktopNavigation.slice(4)
