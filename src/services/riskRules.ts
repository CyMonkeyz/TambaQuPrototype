import type { RiskLevel } from "../domain/risk";

export const RISK_SCORE_RANGES = {
  safe: { min: 0, max: 39 },
  warning: { min: 40, max: 69 },
  critical: { min: 70, max: 100 },
} as const;

export function getRiskLevel(score: number): RiskLevel {
  const normalizedScore = Math.max(0, Math.min(100, score));
  if (normalizedScore >= RISK_SCORE_RANGES.critical.min) return "critical";
  if (normalizedScore >= RISK_SCORE_RANGES.warning.min) return "warning";
  return "safe";
}
