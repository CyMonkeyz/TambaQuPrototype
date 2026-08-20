import { Activity, TrendingUp } from "lucide-react";
import type { RiskAssessment } from "../../domain/risk";
import { RiskBadge } from "../ui/RiskBadge";

export function RiskSummary({
  risk,
  compact = false,
  scoreChange = 0,
  title = "Tingkat Risiko",
}: {
  risk: RiskAssessment;
  compact?: boolean;
  scoreChange?: number;
  title?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#dff3f0] text-primary">
        <Activity size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-primary">{title}</p>
          <RiskBadge level={risk.level} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-[-.05em]">
            {risk.score}
          </span>
          <span className="text-sm text-foreground-muted">/ 100</span>
        </div>
        {scoreChange !== 0 && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-risk-warning">
            <TrendingUp size={14} />
            Naik {scoreChange} poin dibanding 6 jam lalu
          </p>
        )}
        <p
          className={`mt-3 text-sm leading-6 text-foreground-muted ${compact ? "line-clamp-2" : ""}`}
        >
          {risk.summary}
        </p>
        <p className="mt-2 text-xs text-foreground-muted">
          Skor synthetic deterministik · bukan diagnosis otomatis
        </p>
      </div>
    </div>
  );
}
