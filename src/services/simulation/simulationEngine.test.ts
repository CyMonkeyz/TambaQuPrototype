import { describe, expect, it } from "vitest";
import { demoScenarios, getScenario } from "./scenarioDefinitions";
import {
  advanceSimulationState,
  createSimulationState,
  pauseSimulationState,
  startSimulationState,
} from "./simulationEngine";

describe("deterministic demo simulation", () => {
  it("keeps the competition warning sequence stable", () => {
    const scenario = getScenario("warning-escalation");
    expect(scenario.steps.map((step) => step.riskScore)).toEqual([22, 34, 48, 58, 67]);
    expect(scenario.steps.map((step) => step.reading.dissolvedOxygen)).toEqual([5.8, 5.2, 4.8, 4.5, 4.2]);
    expect(scenario.steps.filter((step) => step.alert)).toHaveLength(1);
  });

  it("advances only while running unless explicitly stepped", () => {
    const scenario = getScenario("early-warning");
    const idle = createSimulationState(scenario);
    expect(advanceSimulationState(idle, scenario).currentStep).toBe(0);
    expect(advanceSimulationState(idle, scenario, true).currentStep).toBe(1);
  });

  it("supports pause and completion as explicit states", () => {
    const scenario = getScenario("stable");
    const running = startSimulationState(createSimulationState(scenario));
    expect(pauseSimulationState(running).status).toBe("paused");
    expect(advanceSimulationState(running, scenario).status).toBe("completed");
  });

  it("resumes a paused scenario without losing its step", () => {
    const scenario = getScenario("warning-escalation");
    const running = startSimulationState(createSimulationState(scenario));
    const progressed = advanceSimulationState(running, scenario);
    const paused = pauseSimulationState(progressed);
    const resumed = startSimulationState(paused);
    expect(resumed).toMatchObject({ status: "running", currentStep: 1 });
    expect(advanceSimulationState(resumed, scenario).currentStep).toBe(2);
  });

  it("includes critical, recovery, and device-failure stories", () => {
    expect(demoScenarios.map((scenario) => scenario.id)).toEqual(expect.arrayContaining(["critical", "recovery", "device-failure"]));
    expect(getScenario("critical").steps.map((step) => step.riskScore)).toEqual([67, 76, 84]);
    expect(getScenario("recovery").steps.map((step) => step.riskScore)).toEqual([84, 76, 61, 48]);
    expect(getScenario("device-failure").steps.map((step) => step.connectionStatus)).toEqual(["online", "degraded", "offline", "online"]);
  });
});
