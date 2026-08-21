import { create } from "zustand";
import type {
  SimulationControlState,
  SimulationSpeed,
} from "../domain/simulation";
import { applySimulationStep, resetDemoData } from "../data/repositories";
import {
  defaultScenarioId,
  getScenario,
} from "../services/simulation/scenarioDefinitions";
import {
  advanceSimulationState,
  createSimulationState,
  pauseSimulationState,
  startSimulationState,
} from "../services/simulation/simulationEngine";
import { useConnectivityStore } from "./connectivity-store";

interface SimulationStore extends SimulationControlState {
  presentationMode: boolean;
  selectScenario: (scenarioId: string) => void;
  start: () => void;
  pause: () => void;
  next: () => void;
  reset: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  togglePresentationMode: () => void;
}

let simulationTimer: ReturnType<typeof setTimeout> | null = null;

function clearSimulationTimer() {
  if (simulationTimer) clearTimeout(simulationTimer);
  simulationTimer = null;
}

function scheduleNextStep() {
  clearSimulationTimer();
  const state = useSimulationStore.getState();
  if (state.status !== "running") return;
  const scenario = getScenario(state.scenarioId);
  const step = scenario.steps[state.currentStep];
  simulationTimer = setTimeout(() => {
    const current = useSimulationStore.getState();
    const currentScenario = getScenario(current.scenarioId);
    const nextState = advanceSimulationState(current, currentScenario);
    if (nextState.currentStep !== current.currentStep) {
      applySimulationStep(
        currentScenario,
        currentScenario.steps[nextState.currentStep],
        nextState.currentStep,
      );
    }
    useSimulationStore.setState(nextState);
    if (nextState.status === "running") scheduleNextStep();
  }, step.durationMs / state.speed);
}

const initialScenario = getScenario(defaultScenarioId);

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...createSimulationState(initialScenario),
  presentationMode: false,
  selectScenario: (scenarioId) => {
    clearSimulationTimer();
    const scenario = getScenario(scenarioId);
    applySimulationStep(scenario, scenario.steps[0], 0);
    set({ ...createSimulationState(scenario), presentationMode: get().presentationMode });
  },
  start: () => {
    if (get().status === "completed") return;
    set((state) => startSimulationState(state));
    scheduleNextStep();
  },
  pause: () => {
    clearSimulationTimer();
    set((state) => pauseSimulationState(state));
  },
  next: () => {
    clearSimulationTimer();
    const state = get();
    const scenario = getScenario(state.scenarioId);
    const nextState = advanceSimulationState(state, scenario, true);
    if (nextState.currentStep !== state.currentStep) {
      applySimulationStep(
        scenario,
        scenario.steps[nextState.currentStep],
        nextState.currentStep,
      );
    }
    set(nextState);
    if (nextState.status === "running") scheduleNextStep();
  },
  reset: () => {
    clearSimulationTimer();
    resetDemoData();
    useConnectivityStore.getState().setDemoOverride("auto");
    set({
      ...createSimulationState(initialScenario),
      presentationMode: get().presentationMode,
    });
  },
  setSpeed: (speed) => {
    set({ speed });
    if (get().status === "running") scheduleNextStep();
  },
  togglePresentationMode: () =>
    set((state) => ({ presentationMode: !state.presentationMode })),
}));
