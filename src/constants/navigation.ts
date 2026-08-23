import {
  Bell,
  BrainCircuit,
  Droplets,
  LayoutDashboard,
  RadioTower,
  Settings,
  FileChartColumn,
} from "lucide-react";

export const desktopNavigation = [
  { label: "Beranda", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Kolam", href: "/app/ponds", icon: Droplets },
  { label: "PondBrain", href: "/app/pondbrain", icon: BrainCircuit },
  { label: "Peringatan", href: "/app/alerts", icon: Bell },
  { label: "Laporan", href: "/app/reports", icon: FileChartColumn },
  { label: "Perangkat", href: "/app/devices", icon: RadioTower },
  { label: "Pengaturan", href: "/app/settings", icon: Settings },
];

export const mobilePrimaryNavigation = desktopNavigation.slice(0, 4);
export const mobileMoreNavigation = desktopNavigation.slice(4);
