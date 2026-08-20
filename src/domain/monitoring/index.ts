import type { Alert } from "../alert";
import type { Pond } from "../pond";
import type { RiskAssessment } from "../risk";
import type { SensorDevice, SensorParameter, SensorReading } from "../sensor";

export type TrendDirection = "up" | "down" | "stable";
export type TrendSentiment = "positive" | "negative" | "neutral";
export type SensorHealthState = "normal" | "attention" | "high-risk";
export type DataFreshness = "fresh" | "stale" | "old";
export type MonitoringRange = "6h" | "24h" | "7d";

export interface TrendCalculation {
  direction: TrendDirection;
  percentage: number | null;
  absoluteChange: number;
  hasEnoughData: boolean;
}

export interface TrendInterpretation {
  sentiment: TrendSentiment;
  label: string;
}

export interface PondMonitoringOverview {
  pond: Pond;
  reading: SensorReading;
  history: SensorReading[];
  risk: RiskAssessment;
  device: SensorDevice;
}

export interface FarmMonitoringData {
  ponds: PondMonitoringOverview[];
  alerts: Alert[];
}

export interface PondMonitoringDetail extends PondMonitoringOverview {
  alerts: Alert[];
}

export const SENSOR_PARAMETERS: SensorParameter[] = [
  "dissolvedOxygen",
  "ph",
  "temperature",
  "salinity",
  "ammonia",
  "nitrite",
];

export const RANGE_HOURS: Record<MonitoringRange, number> = {
  "6h": 6,
  "24h": 24,
  "7d": 168,
};
