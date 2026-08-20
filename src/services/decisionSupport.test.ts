import { describe, expect, it } from "vitest";
import type { ActionLog } from "../domain/action";
import type { Alert } from "../domain/alert";
import type { RiskAssessment } from "../domain/risk";
import type { ActionRepository } from "../data/repositories";
import { demoReadings, demoRisks } from "../data/mock/fixtures";
import { completeRecommendation } from "./action/actionService";
import { acknowledgeAlertRecord } from "./alert/alertService";
import { generateRecommendations } from "./recommendation/recommendationEngine";
import {
  buildRiskTrend,
  getRiskLevel,
  sortRiskContributors,
} from "./risk/riskEngine";
import { filterAlerts } from "./selectors";

const warningRisk: RiskAssessment = {
  id: "risk-pond-b",
  pondId: "pond-b",
  timestamp: "2026-08-20T14:42:00.000Z",
  score: 67,
  level: "warning",
  confidence: 0.82,
  summary: "Risiko meningkat.",
  contributors: [
    {
      parameter: "ammonia",
      contribution: 27,
      direction: "up",
      explanation: "Amonia meningkat.",
    },
    {
      parameter: "dissolvedOxygen",
      contribution: 42,
      direction: "down",
      explanation: "DO menurun.",
    },
  ],
};

class MemoryActionRepository implements ActionRepository {
  actions: ActionLog[] = [];
  async getByFarmId() {
    return this.actions;
  }
  async getByPondId(pondId: string) {
    return this.actions.filter((action) => action.pondId === pondId);
  }
  async getByRecommendationId(recommendationId: string) {
    return (
      this.actions.find(
        (action) => action.recommendationId === recommendationId,
      ) ?? null
    );
  }
  async add(action: ActionLog) {
    this.actions.push(action);
    return action;
  }
}

const alerts: Alert[] = [
  {
    id: "new-critical",
    pondId: "pond-c",
    timestamp: "2026-08-20T14:39:00.000Z",
    severity: "critical",
    title: "Kritis",
    description: "Demo",
    parameter: "dissolvedOxygen",
    status: "new",
    riskAssessmentId: "risk-c",
  },
  {
    id: "resolved-warning",
    pondId: "pond-d",
    timestamp: "2026-08-20T12:14:00.000Z",
    severity: "warning",
    title: "Selesai",
    description: "Demo",
    parameter: "multiple",
    status: "resolved",
    riskAssessmentId: "risk-d",
  },
];

describe("decision support rules", () => {
  it("maps risk score boundaries", () => {
    expect(getRiskLevel(39)).toBe("safe");
    expect(getRiskLevel(40)).toBe("warning");
    expect(getRiskLevel(70)).toBe("critical");
  });

  it("sorts contributors from highest contribution", () => {
    expect(sortRiskContributors(warningRisk.contributors)[0].parameter).toBe(
      "dissolvedOxygen",
    );
  });

  it("builds a deterministic rising Kolam B risk trend", () => {
    const risk = demoRisks.find((item) => item.pondId === "pond-b")!;
    const history = demoReadings.filter((item) => item.pondId === "pond-b");
    const trend = buildRiskTrend(history, risk, "6h");
    expect(trend.at(-1)?.score).toBe(67);
    expect(trend[0].score).toBeLessThan(67);
  });

  it("generates explainable Kolam B recommendations", () => {
    const recommendations = generateRecommendations(warningRisk);
    expect(recommendations.map((item) => item.title)).toEqual([
      "Periksa dan optimalkan aerasi",
      "Evaluasi pemberian pakan berikutnya",
      "Periksa kembali parameter dalam 1 jam",
    ]);
  });

  it("prevents duplicate action completion", async () => {
    const repository = new MemoryActionRepository();
    const recommendation = generateRecommendations(warningRisk)[0];
    const input = {
      repository,
      pondId: "pond-b",
      recommendation,
      userId: "user-andi",
      notes: "Aerator tambahan diaktifkan",
      timestamp: "2026-08-20T14:46:00.000Z",
    };
    expect((await completeRecommendation(input)).created).toBe(true);
    expect((await completeRecommendation(input)).created).toBe(false);
    expect(repository.actions).toHaveLength(1);
  });

  it("acknowledges a new alert with audit fields", () => {
    const acknowledged = acknowledgeAlertRecord(
      alerts[0],
      "user-andi",
      "2026-08-20T14:50:00.000Z",
    );
    expect(acknowledged.status).toBe("acknowledged");
    expect(acknowledged.acknowledgedBy).toBe("user-andi");
  });

  it("filters active, critical, and resolved alerts", () => {
    expect(filterAlerts(alerts, "active")).toHaveLength(1);
    expect(filterAlerts(alerts, "critical")[0].id).toBe("new-critical");
    expect(filterAlerts(alerts, "resolved")[0].id).toBe("resolved-warning");
  });
});
