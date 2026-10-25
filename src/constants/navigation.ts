import {
  Bell,
  BrainCircuit,
  Droplets,
  LayoutDashboard,
  RadioTower,
  Settings,
  FileChartColumn,
  Users,
  Receipt,
  Grid2X2,
} from "lucide-react";
import { cultivationModules } from "../operations/moduleCatalog";

export const desktopNavigation = [
  { label: "Beranda", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Kolam", href: "/app/ponds", icon: Droplets },
  { label: "PondBrain", href: "/app/pondbrain", icon: BrainCircuit },
  { label: "Peringatan", href: "/app/alerts", icon: Bell },
  { label: "Semua fitur", href: "/app/cultivation", icon: Grid2X2 },
  ...cultivationModules.map((item) => ({
    label: item.name,
    href: `/app/modules/${item.id}`,
    icon: item.icon,
  })),
  { label: "Perangkat", href: "/app/devices", icon: RadioTower },
  { label: "Laporan", href: "/app/reports", icon: FileChartColumn },
  { label: "Tim & Layanan", href: "/app/services", icon: Users },
  { label: "Langganan & Tagihan", href: "/app/billing", icon: Receipt },
  { label: "Pengaturan", href: "/app/settings", icon: Settings },
];

export const mobilePrimaryNavigation = desktopNavigation.slice(0, 4);
export const mobileMoreNavigation = desktopNavigation.slice(4);
export const navigationGroups = [
  { label: "Pantau", items: desktopNavigation.slice(0, 4) },
  { label: "Budidaya", items: desktopNavigation.slice(4, 10) },
  { label: "Kelola", items: desktopNavigation.slice(10) },
];

