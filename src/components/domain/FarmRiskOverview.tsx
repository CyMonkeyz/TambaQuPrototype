import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  OctagonAlert,
} from "lucide-react";
import type { PondMonitoringOverview } from "../../domain/monitoring";
import { getFarmRiskSummary } from "../../services/monitoring";
import { Card } from "../ui/Card";

export function FarmRiskOverview({
  ponds,
}: {
  ponds: PondMonitoringOverview[];
}) {
  const summary = getFarmRiskSummary(ponds);
  const items = [
    {
      label: "Dipantau",
      value: summary.total,
      icon: Droplets,
      className: "text-primary bg-[#dff3f0]",
    },
    {
      label: "Aman",
      value: summary.safe,
      icon: CheckCircle2,
      className: "text-risk-safe bg-[var(--risk-safe-bg)]",
    },
    {
      label: "Waspada",
      value: summary.warning,
      icon: AlertTriangle,
      className: "text-risk-warning bg-[var(--risk-warning-bg)]",
    },
    {
      label: "Kritis",
      value: summary.critical,
      icon: OctagonAlert,
      className: "text-risk-critical bg-[var(--risk-critical-bg)]",
    },
  ];
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
      aria-label="Ringkasan tingkat risiko tambak"
    >
      {items.map((item) => (
        <Card
          key={item.label}
          className="flex items-center gap-3 p-3 shadow-none sm:p-4"
        >
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-xl ${item.className}`}
          >
            <item.icon size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-semibold tracking-[-.03em]">
              {item.value}
            </p>
            <p className="text-xs font-medium text-foreground-muted">
              {item.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
