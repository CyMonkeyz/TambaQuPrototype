import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { ActionLog } from "../../domain/action";
import { formatDate, formatWibTime } from "../../utils/formatters";

export function ActionTimeline({
  actions,
  performerName,
}: {
  actions: ActionLog[];
  performerName: string;
}) {
  const sorted = [...actions].sort(
    (a, b) => Date.parse(b.performedAt) - Date.parse(a.performedAt),
  );
  if (!sorted.length) {
    return (
      <p className="text-sm text-foreground-muted">
        Belum ada tindakan yang tercatat.
      </p>
    );
  }
  return (
    <ol className="relative ml-2 border-l border-border">
      {sorted.map((action) => (
        <li key={action.id} className="relative pb-6 pl-6 last:pb-0">
          <span className="absolute -left-2.5 top-0 grid size-5 place-items-center rounded-full bg-[var(--risk-safe-bg)] text-risk-safe ring-4 ring-surface">
            <CheckCircle2 size={13} aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold text-primary">
            {formatWibTime(action.performedAt)}
          </p>
          <h3 className="mt-1 text-sm font-semibold">{action.actionTitle}</h3>
          <p className="mt-1 text-xs text-foreground-muted">
            {performerName} · {formatDate(action.performedAt)}
          </p>
          {action.notes && (
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              {action.notes}
            </p>
          )}
          <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${action.syncStatus === "synced" ? "text-risk-safe" : action.syncStatus === "failed" ? "text-risk-critical" : "text-risk-warning"}`}>
            {action.syncStatus === "synced" ? <CheckCircle2 size={13} /> : action.syncStatus === "failed" ? <AlertTriangle size={13} /> : <CircleDashed size={13} />}
            {action.syncStatus === "synced" ? "Tersinkron" : action.syncStatus === "failed" ? "Sinkronisasi gagal" : "Menunggu sinkronisasi"}
          </p>
        </li>
      ))}
    </ol>
  );
}
