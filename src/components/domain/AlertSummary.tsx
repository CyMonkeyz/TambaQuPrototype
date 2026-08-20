import { AlertOctagon, AlertTriangle, CheckCheck } from "lucide-react";
import type { Alert } from "../../domain/alert";
import { countAlerts } from "../../services/selectors";

export function AlertSummary({ alerts }: { alerts: Alert[] }) {
  const summary = countAlerts(alerts);
  const items = [
    {
      label: "Kritis",
      value: summary.critical,
      icon: AlertOctagon,
      className: "text-risk-critical",
    },
    {
      label: "Waspada",
      value: summary.warning,
      icon: AlertTriangle,
      className: "text-risk-warning",
    },
    {
      label: "Selesai",
      value: summary.resolved,
      icon: CheckCheck,
      className: "text-risk-safe",
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-3" aria-label="Ringkasan peringatan">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-surface-muted p-3 sm:p-4"
        >
          <item.icon className={item.className} size={18} aria-hidden="true" />
          <p className="mt-3 text-2xl font-semibold">{item.value}</p>
          <p className="text-xs text-foreground-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
