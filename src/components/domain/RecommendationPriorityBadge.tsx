import type { RecommendationPriority } from "../../domain/risk";
import { Badge } from "../ui/Badge";

const labels: Record<RecommendationPriority, string> = {
  urgent: "Prioritas Segera",
  high: "Prioritas Tinggi",
  medium: "Prioritas Sedang",
  low: "Pantau",
};

const classes: Record<RecommendationPriority, string> = {
  urgent: "bg-[var(--risk-critical-bg)] text-risk-critical",
  high: "bg-[var(--risk-warning-bg)] text-risk-warning",
  medium: "bg-surface-muted text-primary",
  low: "bg-[var(--risk-safe-bg)] text-risk-safe",
};

export function RecommendationPriorityBadge({
  priority,
}: {
  priority: RecommendationPriority;
}) {
  return <Badge className={classes[priority]}>{labels[priority]}</Badge>;
}
