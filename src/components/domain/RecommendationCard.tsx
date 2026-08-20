import { CheckCircle2, Clock3 } from "lucide-react";
import type { ActionLog } from "../../domain/action";
import type { Recommendation } from "../../domain/risk";
import { formatWibTime } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { RecommendationPriorityBadge } from "./RecommendationPriorityBadge";

export function RecommendationCard({
  recommendation,
  action,
  performerName,
  onComplete,
}: {
  recommendation: Recommendation;
  action?: ActionLog;
  performerName: string;
  onComplete: (recommendation: Recommendation) => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RecommendationPriorityBadge priority={recommendation.priority} />
        <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
          <Clock3 size={14} aria-hidden="true" />
          Target{" "}
          {recommendation.targetCompletionMinutes === 15
            ? "segera"
            : `${recommendation.targetCompletionMinutes} menit`}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold">{recommendation.title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">
        <span className="font-semibold text-foreground">Alasan: </span>
        {recommendation.description}
      </p>
      {action ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-[var(--risk-safe-bg)] p-3 text-sm">
          <CheckCircle2 className="mt-0.5 shrink-0 text-risk-safe" size={18} />
          <div>
            <p className="font-semibold text-risk-safe">Sudah Dilakukan</p>
            <p className="mt-1 text-xs text-foreground-muted">
              {formatWibTime(action.performedAt)} · oleh {performerName}
            </p>
          </div>
        </div>
      ) : (
        <Button
          className="mt-5 w-full sm:w-auto"
          onClick={() => onComplete(recommendation)}
        >
          Tandai Sudah Dilakukan
        </Button>
      )}
    </article>
  );
}
