import { CheckCheck, CircleDot, Eye } from "lucide-react";
import type { AlertStatus } from "../../domain/alert";
import { Badge } from "../ui/Badge";

const config = {
  new: {
    label: "Belum ditinjau",
    icon: CircleDot,
    className: "bg-[var(--risk-warning-bg)] text-risk-warning",
  },
  acknowledged: {
    label: "Sudah ditinjau",
    icon: Eye,
    className: "bg-surface-muted text-primary",
  },
  resolved: {
    label: "Tindak Lanjut Tercatat",
    icon: CheckCheck,
    className: "bg-[var(--risk-safe-bg)] text-risk-safe",
  },
} satisfies Record<
  AlertStatus,
  { label: string; icon: typeof Eye; className: string }
>;

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const item = config[status];
  return (
    <Badge className={item.className}>
      <item.icon size={13} aria-hidden="true" />
      {item.label}
    </Badge>
  );
}
