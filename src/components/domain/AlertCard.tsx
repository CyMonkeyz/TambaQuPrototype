import { AlertTriangle, ArrowRight } from "lucide-react";
import type { Alert } from "../../domain/alert";
import type { Pond } from "../../domain/pond";
import { formatRelativeDemoTime, formatWibTime } from "../../utils/formatters";
import { RiskBadge } from "../ui/RiskBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";

export function AlertCard({
  alert,
  pond,
  onOpen,
}: {
  alert: Alert;
  pond: Pond;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${alert.severity === "critical" ? "bg-[var(--risk-critical-bg)] text-risk-critical" : "bg-[var(--risk-warning-bg)] text-risk-warning"}`}
        >
          <AlertTriangle size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={alert.severity} />
            <AlertStatusBadge status={alert.status} />
          </div>
          <h2 className="mt-3 font-semibold">{pond.name}</h2>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            {alert.title}
          </p>
          <p className="mt-3 text-xs text-foreground-muted">
            {formatWibTime(alert.timestamp)} ·{" "}
            {formatRelativeDemoTime(alert.timestamp)}
          </p>
          <button
            type="button"
            onClick={onOpen}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            Lihat Detail <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
