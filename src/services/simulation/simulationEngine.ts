import type {
  DemoScenario,
  SimulationControlState,
} from "../../domain/simulation";

export function createSimulationState(
  scenario: DemoScenario,
): SimulationControlState {
  return {
    scenarioId: scenario.id,
    status: "idle",
    currentStep: 0,
    speed: 1,
    startedAt: null,
    selectedPondId: scenario.pondId,
  };
}

export function startSimulationState(
  state: SimulationControlState,
): SimulationControlState {
  return {
    ...state,
    status: "running",
    startedAt: state.startedAt ?? new Date().toISOString(),
  };
}

export function pauseSimulationState(
  state: SimulationControlState,
): SimulationControlState {
  return state.status === "running" ? { ...state, status: "paused" } : state;
}

export function advanceSimulationState(
  state: SimulationControlState,
  scenario: DemoScenario,
  force = false,
): SimulationControlState {
  if (!force && state.status !== "running") return state;
  const nextStep = state.currentStep + 1;
  if (nextStep >= scenario.steps.length) {
    return { ...state, status: "completed" };
  }
  return { ...state, currentStep: nextStep };
}
