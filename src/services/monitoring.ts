import type {
  PondMonitoringOverview,
  SensorHealthState,
  TrendCalculation,
  TrendDirection,
  TrendInterpretation,
} from "../domain/monitoring";
import type { RiskLevel } from "../domain/risk";
import type { SensorParameter } from "../domain/sensor";

const riskPriority: Record<RiskLevel, number> = {
  critical: 3,
  warning: 2,
  safe: 1,
};

export function calculateTrend(
  values: number[],
  comparisonWindow = 6,
): TrendCalculation {
  if (values.length < 2 || comparisonWindow < 1) {
    return {
      direction: "stable",
      percentage: null,
      absoluteChange: 0,
      hasEnoughData: false,
    };
  }
  const latest = values.at(-1) ?? 0;
  const baseline = values[Math.max(0, values.length - 1 - comparisonWindow)];
  const absoluteChange = latest - baseline;
  const percentage =
    baseline === 0 ? null : (absoluteChange / Math.abs(baseline)) * 100;
  const tolerance = Math.max(Math.abs(baseline) * 0.005, 0.001);
  const direction: TrendDirection =
    absoluteChange > tolerance
      ? "up"
      : absoluteChange < -tolerance
        ? "down"
        : "stable";
  return { direction, percentage, absoluteChange, hasEnoughData: true };
}

export function interpretTrend(
  parameter: SensorParameter,
  direction: TrendDirection,
): TrendInterpretation {
  if (direction === "stable")
    return { sentiment: "neutral", label: "Relatif stabil" };
  if (parameter === "dissolvedOxygen") {
    return direction === "up"
      ? { sentiment: "positive", label: "DO meningkat" }
      : { sentiment: "negative", label: "DO menurun" };
  }
  if (parameter === "ammonia" || parameter === "nitrite") {
    return direction === "down"
      ? { sentiment: "positive", label: "Kadar menurun" }
      : { sentiment: "negative", label: "Kadar meningkat" };
  }
  if (parameter === "temperature") {
    return direction === "up"
      ? { sentiment: "negative", label: "Suhu meningkat" }
      : { sentiment: "neutral", label: "Suhu menurun" };
  }
  return {
    sentiment: "neutral",
    label: direction === "up" ? "Nilai meningkat" : "Nilai menurun",
  };
}

export function getSensorHealth(
  parameter: SensorParameter,
  value: number,
): SensorHealthState {
  switch (parameter) {
    case "dissolvedOxygen":
      return value >= 5 ? "normal" : value >= 4 ? "attention" : "high-risk";
    case "ph":
      return value >= 7.6 && value <= 8.3
        ? "normal"
        : value >= 7.2 && value <= 8.6
          ? "attention"
          : "high-risk";
    case "temperature":
      return value >= 28 && value <= 30
        ? "normal"
        : value >= 27 && value <= 31
          ? "attention"
          : "high-risk";
    case "salinity":
      return value >= 17 && value <= 22
        ? "normal"
        : value >= 14 && value <= 25
          ? "attention"
          : "high-risk";
    case "ammonia":
      return value <= 0.05
        ? "normal"
        : value <= 0.15
          ? "attention"
          : "high-risk";
    case "nitrite":
      return value <= 0.03
        ? "normal"
        : value <= 0.08
          ? "attention"
          : "high-risk";
  }
}

export function getDataFreshness(
  timestamp: string,
  referenceTimestamp: string,
): { state: "fresh" | "stale" | "old"; minutesAgo: number } {
  const minutesAgo = Math.max(
    0,
    Math.round(
      (new Date(referenceTimestamp).getTime() - new Date(timestamp).getTime()) /
        60_000,
    ),
  );
  const state = minutesAgo < 5 ? "fresh" : minutesAgo <= 30 ? "stale" : "old";
  return { state, minutesAgo };
}

export function getFarmRiskSummary(ponds: PondMonitoringOverview[]) {
  const counts = ponds.reduce(
    (summary, item) => ({
      ...summary,
      [item.risk.level]: summary[item.risk.level] + 1,
    }),
    { safe: 0, warning: 0, critical: 0 },
  );
  const highestRiskPond =
    [...ponds].sort((a, b) => b.risk.score - a.risk.score)[0] ?? null;
  return { ...counts, total: ponds.length, highestRiskPond };
}

export type PondSort = "risk" | "name" | "updated";

export function sortPondMonitoring(
  pondItems: PondMonitoringOverview[],
  sort: PondSort,
) {
  return [...pondItems].sort((a, b) => {
    if (sort === "name") return a.pond.name.localeCompare(b.pond.name, "id-ID");
    if (sort === "updated")
      return (
        new Date(b.device.lastSyncAt).getTime() -
        new Date(a.device.lastSyncAt).getTime()
      );
    return (
      riskPriority[b.risk.level] - riskPriority[a.risk.level] ||
      b.risk.score - a.risk.score
    );
  });
}

export function createMonitoringSummary(
  item: PondMonitoringOverview,
  hours = 6,
) {
  const doTrend = calculateTrend(
    item.history.map((reading) => reading.dissolvedOxygen),
    hours,
  );
  const ammoniaTrend = calculateTrend(
    item.history.map((reading) => reading.ammonia),
    hours,
  );
  if (
    item.risk.level === "safe" &&
    doTrend.direction === "stable" &&
    ammoniaTrend.direction === "stable"
  ) {
    return {
      title: `Tren ${hours} jam relatif stabil`,
      description:
        "Parameter utama tidak menunjukkan perubahan signifikan pada data simulasi.",
    };
  }
  const parts: string[] = [];
  if (doTrend.direction === "down") parts.push("DO terus menurun");
  if (ammoniaTrend.direction === "up") parts.push("amonia meningkat");
  if (parts.length === 0) parts.push("beberapa parameter berubah");
  return {
    title: `Tren ${hours} jam perlu dipantau`,
    description: `${parts.join(" dan ")}. Verifikasi kondisi lapangan bila perubahan berlanjut.`,
  };
}

export function calculateRiskScoreChange(
  item: PondMonitoringOverview,
  hours = 6,
) {
  const doTrend = calculateTrend(
    item.history.map((reading) => reading.dissolvedOxygen),
    hours,
  );
  const ammoniaTrend = calculateTrend(
    item.history.map((reading) => reading.ammonia),
    hours,
  );
  const nitriteTrend = calculateTrend(
    item.history.map((reading) => reading.nitrite),
    hours,
  );
  return (
    (doTrend.direction === "down" ? 7 : 0) +
    (ammoniaTrend.direction === "up" ? 5 : 0) +
    (nitriteTrend.direction === "up" ? 3 : 0)
  );
}
