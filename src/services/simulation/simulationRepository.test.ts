import { afterEach, describe, expect, it } from "vitest";
import type { ActionLog } from "../../domain/action";
import {
  applySimulationStep,
  resetMockDemoState,
} from "../../data/repositories/mock";
import { remoteRepositories as repositories } from "../../data/repositories/remote";
import { getScenario } from "./scenarioDefinitions";

describe("simulation repository overlay", () => {
  afterEach(() => resetMockDemoState());

  it("starts and resets Kolam B at the stable baseline", async () => {
    resetMockDemoState();
    expect(await repositories.sensor.getCurrentReading("pond-b")).toMatchObject({ dissolvedOxygen: 5.8, ammonia: 0.03 });
    expect(await repositories.risk.getCurrentByPondId("pond-b")).toMatchObject({ score: 22, level: "safe" });
  });

  it("applies the expected final warning state and creates its alert once", async () => {
    const scenario = getScenario("warning-escalation");
    scenario.steps.forEach((step, index) => applySimulationStep(scenario, step, index));
    applySimulationStep(scenario, scenario.steps.at(-1)!, scenario.steps.length - 1);
    expect(await repositories.sensor.getCurrentReading("pond-b")).toMatchObject({ dissolvedOxygen: 4.2, ammonia: 0.14 });
    const alerts = await repositories.alert.getByPondId("pond-b");
    expect(alerts.filter((alert) => alert.id === "sim-alert-b-warning")).toHaveLength(1);
    const risk = await repositories.risk.getCurrentByPondId("pond-b");
    expect(risk).toMatchObject({ score: 67, level: "warning" });
    expect((await repositories.risk.getRecommendations(risk?.id ?? "")).some((item) => item.title === "Periksa dan optimalkan aerasi")).toBe(true);
  });

  it("creates a critical alert once", async () => {
    const scenario = getScenario("critical");
    const final = scenario.steps.at(-1)!;
    applySimulationStep(scenario, final, scenario.steps.length - 1);
    applySimulationStep(scenario, final, scenario.steps.length - 1);
    const alerts = await repositories.alert.getByPondId("pond-b");
    expect(alerts.filter((alert) => alert.id === "sim-alert-b-critical")).toHaveLength(1);
    expect(await repositories.risk.getCurrentByPondId("pond-b")).toMatchObject({ score: 84, level: "critical" });
  });

  it("keeps farmer actions while later simulation steps are applied", async () => {
    const action: ActionLog = { id: "action-sim-test", pondId: "pond-b", recommendationId: "rec-sim-test", actionTitle: "Aerasi dioptimalkan", performedBy: "user-andi", performedAt: "2026-08-20T15:00:00.000Z", notes: "Aerator tambahan diaktifkan.", syncStatus: "synced" };
    await repositories.action.add(action);
    const recovery = getScenario("recovery");
    applySimulationStep(recovery, recovery.steps[1], 1);
    expect(await repositories.action.getByRecommendationId(action.recommendationId)).toMatchObject({ id: action.id });
  });
});
