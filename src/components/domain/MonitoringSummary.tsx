import { Activity } from "lucide-react";
import type { PondMonitoringOverview } from "../../domain/monitoring";
import { createMonitoringSummary } from "../../services/monitoring";

export function MonitoringSummary({ item }: { item: PondMonitoringOverview }) {
  const summary = createMonitoringSummary(item);
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-muted p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-primary">
        <Activity size={18} />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-primary">
          Ringkasan Monitoring
        </p>
        <p className="mt-1 font-semibold">{summary.title}</p>
        <p className="mt-1 text-sm leading-6 text-foreground-muted">
          {summary.description}
        </p>
      </div>
    </div>
  );
}
