import type { MonitoringRange } from "../../domain/monitoring";
import { RANGE_HOURS } from "../../domain/monitoring";
import type {
  RiskAssessment,
  RiskContributor,
  RiskTrendPoint,
} from "../../domain/risk";
import type { SensorDevice, SensorReading } from "../../domain/sensor";
import { getRiskLevel } from "../riskRules";

export { getRiskLevel } from "../riskRules";

const clampScore = (score: number) => Math.max(0, Math.min(100, score));

export function calculateSyntheticRiskScore(reading: SensorReading) {
  const dissolvedOxygen = Math.max(0, 6 - reading.dissolvedOxygen) * 20;
  const ammonia = reading.ammonia * 100;
  const nitrite = reading.nitrite * 80;
  const temperature = Math.max(0, reading.temperature - 29) * 6;
  return clampScore(
    Math.round(dissolvedOxygen + ammonia + nitrite + temperature),
  );
}

export function sortRiskContributors(contributors: RiskContributor[]) {
  return [...contributors].sort((a, b) => b.contribution - a.contribution);
}

export function buildRiskTrend(
  history: SensorReading[],
  current: RiskAssessment,
  range: MonitoringRange,
): RiskTrendPoint[] {
  const readings = history.slice(-(RANGE_HOURS[range] + 1));
  if (!readings.length) return [];
  const latestSynthetic = calculateSyntheticRiskScore(readings.at(-1)!);
  const sensitivity =
    current.level === "critical" ? 3 : current.level === "warning" ? 4 : 1.5;
  const desiredPoints = range === "6h" ? 7 : range === "24h" ? 9 : 8;
  const step = Math.max(
    1,
    Math.floor((readings.length - 1) / (desiredPoints - 1)),
  );
  const sampled = readings.filter(
    (_, index) => index % step === 0 || index === readings.length - 1,
  );
  return sampled.slice(-desiredPoints).map((reading, index, items) => ({
    timestamp: reading.timestamp,
    score:
      index === items.length - 1
        ? current.score
        : clampScore(
            Math.round(
              current.score +
                (calculateSyntheticRiskScore(reading) - latestSynthetic) *
                  sensitivity,
            ),
          ),
  }));
}

export function calculateDataConfidence({
  reading,
  device,
  contributors,
}: {
  reading: SensorReading;
  device: SensorDevice;
  contributors: RiskContributor[];
}) {
  const values = [
    reading.dissolvedOxygen,
    reading.ph,
    reading.temperature,
    reading.salinity,
    reading.ammonia,
    reading.nitrite,
  ];
  const completeness = values.filter(Number.isFinite).length / values.length;
  const freshness =
    device.connectionStatus === "online"
      ? 1
      : device.connectionStatus === "degraded"
        ? 0.3
        : 0.1;
  const coverage = Math.min(1, contributors.length / 4);
  return Math.round(
    (completeness * 0.55 + freshness * 0.25 + coverage * 0.2) * 100,
  );
}

export function describeRiskChange(points: RiskTrendPoint[]) {
  if (points.length < 2) return { change: 0, direction: "stable" as const };
  const change = points.at(-1)!.score - points[0].score;
  return {
    change: Math.abs(change),
    direction:
      change > 1
        ? ("up" as const)
        : change < -1
          ? ("down" as const)
          : ("stable" as const),
  };
}

export function validateRiskAssessment(risk: RiskAssessment) {
  return {
    ...risk,
    score: clampScore(risk.score),
    level: getRiskLevel(risk.score),
    contributors: sortRiskContributors(risk.contributors),
  };
}
