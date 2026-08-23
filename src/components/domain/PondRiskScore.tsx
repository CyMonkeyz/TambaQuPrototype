import { Activity, ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { RiskAssessment } from "../../domain/risk";
import { RiskBadge } from "../ui/RiskBadge";

export function PondRiskScore({
  risk,
  change,
  direction,
}: {
  risk: RiskAssessment;
  change: number;
  direction: "up" | "down" | "stable";
}) {
  const statusCopy =
    risk.level === "critical"
      ? "Perlu perhatian segera"
      : risk.level === "warning"
        ? "Perlu dipantau dan ditindaklanjuti"
        : "Kondisi relatif stabil";
  const TrendIcon =
    direction === "up"
      ? ArrowUp
      : direction === "down"
        ? ArrowDown
        : ArrowRight;

  return (
    <section aria-labelledby="risk-score-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            id="risk-score-title"
            className="text-sm font-semibold text-primary"
          >
            Skor Risiko PondBrain
          </p>
          <div className="mt-2 flex items-end gap-2">
            <strong className="text-5xl font-semibold tracking-[-.06em] sm:text-6xl">
              {risk.score}
            </strong>
            <span className="pb-1 text-sm text-foreground-muted">/ 100</span>
          </div>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary">
          <Activity size={22} aria-hidden="true" />
        </span>
      </div>
      <div
        className="mt-5 grid grid-cols-[39fr_30fr_31fr] gap-1"
        role="img"
        aria-label={`Skor risiko ${risk.score} dari 100, tingkat ${risk.level === "safe" ? "Aman" : risk.level === "warning" ? "Waspada" : "Kritis"}`}
      >
        <span className="h-3 rounded-l-full bg-risk-safe" />
        <span className="h-3 bg-risk-warning" />
        <span className="h-3 rounded-r-full bg-risk-critical" />
      </div>
      <div
        className="mt-2 flex justify-between text-[10px] font-medium text-foreground-muted"
        aria-hidden="true"
      >
        <span>Aman 0–39</span>
        <span>Waspada 40–69</span>
        <span>Kritis 70–100</span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <RiskBadge level={risk.level} />
        <p className="text-sm font-semibold">{statusCopy}</p>
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground-muted">
        <TrendIcon size={16} aria-hidden="true" />
        {direction === "stable"
          ? "Relatif stabil dalam 6 jam terakhir"
          : `${direction === "up" ? "Naik" : "Turun"} ${change} poin dalam 6 jam terakhir`}
      </p>
    </section>
  );
}
