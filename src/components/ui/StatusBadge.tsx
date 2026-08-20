import { AlertTriangle, Check, CircleOff } from "lucide-react";
import type { DeviceConnectionStatus } from "../../domain/sensor";
import type { PondOperationalStatus } from "../../domain/pond";
import { Badge } from "./Badge";

type Status = DeviceConnectionStatus | PondOperationalStatus;

const statusConfig: Record<
  Status,
  { label: string; className: string; icon: typeof Check }
> = {
  online: {
    label: "Online",
    className: "bg-[var(--risk-safe-bg)] text-[var(--status-online)]",
    icon: Check,
  },
  offline: {
    label: "Offline",
    className: "bg-surface-muted text-[var(--status-offline)]",
    icon: CircleOff,
  },
  degraded: {
    label: "Koneksi Lemah",
    className: "bg-[var(--risk-warning-bg)] text-[var(--status-degraded)]",
    icon: AlertTriangle,
  },
  active: {
    label: "Aktif",
    className: "bg-[var(--risk-safe-bg)] text-[var(--status-online)]",
    icon: Check,
  },
  maintenance: {
    label: "Pemeliharaan",
    className: "bg-[var(--risk-warning-bg)] text-[var(--status-degraded)]",
    icon: AlertTriangle,
  },
  inactive: {
    label: "Tidak aktif",
    className: "bg-surface-muted text-[var(--status-offline)]",
    icon: CircleOff,
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge className={config.className}>
      <Icon size={13} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
