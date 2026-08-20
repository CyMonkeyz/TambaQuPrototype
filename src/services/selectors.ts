import type { ActionLog } from "../domain/action";
import type { Alert, AlertStatus } from "../domain/alert";
import type { Recommendation, RiskContributor } from "../domain/risk";

export type AlertFilter = "all" | "active" | "critical" | "resolved";

export function getCompletedRecommendationIds(actions: ActionLog[]) {
  return new Set(actions.map((action) => action.recommendationId));
}

export function getPendingRecommendations(
  recommendations: Recommendation[],
  actions: ActionLog[],
) {
  const completed = getCompletedRecommendationIds(actions);
  return recommendations.filter((item) => !completed.has(item.id));
}

export function getTopRiskContributor(contributors: RiskContributor[]) {
  return [...contributors].sort((a, b) => b.contribution - a.contribution)[0];
}

export function filterAlerts(alerts: Alert[], filter: AlertFilter) {
  if (filter === "active") {
    return alerts.filter((item) => item.status !== "resolved");
  }
  if (filter === "critical") {
    return alerts.filter((item) => item.severity === "critical");
  }
  if (filter === "resolved") {
    return alerts.filter((item) => item.status === "resolved");
  }
  return alerts;
}

export function countAlerts(alerts: Alert[]) {
  const byStatus: Record<AlertStatus, number> = {
    new: 0,
    acknowledged: 0,
    resolved: 0,
  };
  alerts.forEach((alert) => {
    byStatus[alert.status] += 1;
  });
  return {
    critical: alerts.filter(
      (item) => item.severity === "critical" && item.status !== "resolved",
    ).length,
    warning: alerts.filter(
      (item) => item.severity === "warning" && item.status !== "resolved",
    ).length,
    ...byStatus,
  };
}
