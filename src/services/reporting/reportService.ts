import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import type { Recommendation, RiskAssessment, RiskLevel } from "../../domain/risk";
import type { DeviceConnectionStatus, SensorParameter, SensorReading } from "../../domain/sensor";

export type ReportPeriod = "24h" | "7d" | "30d" | "cycle";

export interface ReportKpis {
  averageRisk: number;
  highestRisk: number;
  activeAlerts: number;
  actionsTaken: number;
  uptime: number;
  completeness: number;
}

export function filterReadingsByPeriod(readings: SensorReading[], period: ReportPeriod) {
  if (period === "cycle" || readings.length === 0) return readings;
  const hours = { "24h": 24, "7d": 168, "30d": 720 }[period];
  const latest = Date.parse(readings.at(-1)?.timestamp ?? "");
  const cutoff = latest - hours * 3_600_000;
  return readings.filter((reading) => Date.parse(reading.timestamp) >= cutoff);
}

export function aggregateReportKpis({
  risks,
  alerts,
  actions,
  connections,
}: {
  risks: RiskAssessment[];
  alerts: Alert[];
  actions: ActionLog[];
  connections: DeviceConnectionStatus[];
}): ReportKpis {
  const averageRisk = risks.length
    ? Math.round(risks.reduce((sum, item) => sum + item.score, 0) / risks.length)
    : 0;
  const availability: Record<DeviceConnectionStatus, number> = {
    online: 100,
    degraded: 92,
    offline: 72,
  };
  const uptime = connections.length
    ? Math.round(connections.reduce((sum, item) => sum + availability[item], 0) / connections.length)
    : 0;
  return {
    averageRisk,
    highestRisk: Math.max(0, ...risks.map((item) => item.score)),
    activeAlerts: alerts.filter((item) => item.status !== "resolved").length,
    actionsTaken: actions.length,
    uptime,
    completeness: Math.max(0, Math.min(100, uptime - connections.filter((item) => item === "offline").length * 4)),
  };
}

export function summarizeParameter(readings: SensorReading[], parameter: SensorParameter) {
  const values = readings.map((reading) => reading[parameter]);
  const current = values.at(-1) ?? 0;
  const first = values[0] ?? current;
  return {
    current,
    average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    minimum: values.length ? Math.min(...values) : 0,
    maximum: values.length ? Math.max(...values) : 0,
    trend: current > first ? "up" : current < first ? "down" : "stable",
  } as const;
}

export function countRiskLevels(risks: RiskAssessment[]) {
  return risks.reduce<Record<RiskLevel, number>>(
    (counts, risk) => ({ ...counts, [risk.level]: counts[risk.level] + 1 }),
    { safe: 0, warning: 0, critical: 0 },
  );
}

export function summarizeActions(recommendations: Recommendation[], actions: ActionLog[]) {
  const completed = new Set(actions.map((item) => item.recommendationId));
  const completedCount = recommendations.filter((item) => completed.has(item.id)).length;
  const recommended = recommendations.length;
  return {
    recommended,
    completed: completedCount,
    pending: Math.max(0, recommended - completedCount),
    completionRate: recommended ? Math.round((completedCount / recommended) * 100) : 0,
  };
}
