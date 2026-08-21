import { describe, expect, it } from "vitest";
import type { SensorReading } from "../../domain/sensor";
import {
  aggregateReportKpis,
  filterReadingsByPeriod,
  summarizeActions,
  summarizeParameter,
} from "./reportService";

const reading = (id: string, timestamp: string, dissolvedOxygen: number): SensorReading => ({
  id,
  pondId: "pond-b",
  timestamp,
  dissolvedOxygen,
  ph: 8,
  temperature: 29,
  salinity: 19,
  ammonia: 0.03,
  nitrite: 0.02,
});

describe("report aggregations", () => {
  it("filters readings against the latest sample for deterministic periods", () => {
    const readings = [reading("old", "2026-08-18T00:00:00.000Z", 6), reading("new", "2026-08-20T00:00:00.000Z", 5)];
    expect(filterReadingsByPeriod(readings, "24h").map((item) => item.id)).toEqual(["new"]);
    expect(filterReadingsByPeriod(readings, "cycle")).toHaveLength(2);
  });

  it("summarizes current, average, min, max, and trend", () => {
    const result = summarizeParameter([reading("a", "2026-08-20T00:00:00.000Z", 6), reading("b", "2026-08-20T01:00:00.000Z", 4)], "dissolvedOxygen");
    expect(result).toMatchObject({ current: 4, average: 5, minimum: 4, maximum: 6, trend: "down" });
  });

  it("aggregates risk, alerts, actions, and device availability", () => {
    const result = aggregateReportKpis({
      risks: [{ id: "risk", pondId: "pond-b", timestamp: "2026-08-20T00:00:00.000Z", score: 67, level: "warning", confidence: 0.8, contributors: [], summary: "" }],
      alerts: [{ id: "alert", pondId: "pond-b", timestamp: "2026-08-20T00:00:00.000Z", severity: "warning", title: "", description: "", parameter: "multiple", status: "new", riskAssessmentId: "risk" }],
      actions: [],
      connections: ["online", "offline"],
    });
    expect(result).toMatchObject({ averageRisk: 67, highestRisk: 67, activeAlerts: 1, uptime: 86, completeness: 82 });
  });

  it("matches actions to recommendations without overcounting", () => {
    const recommendations = [{ id: "rec-a", riskAssessmentId: "risk", priority: "high" as const, title: "A", description: "", targetCompletionMinutes: 30 }, { id: "rec-b", riskAssessmentId: "risk", priority: "low" as const, title: "B", description: "", targetCompletionMinutes: 60 }];
    const actions = [{ id: "action-a", pondId: "pond-b", recommendationId: "rec-a", actionTitle: "A", performedBy: "user", performedAt: "2026-08-20T00:00:00.000Z", notes: "", syncStatus: "synced" as const }];
    expect(summarizeActions(recommendations, actions)).toEqual({ recommended: 2, completed: 1, pending: 1, completionRate: 50 });
  });
});
