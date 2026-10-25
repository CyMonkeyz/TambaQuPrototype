import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SimulationControlState } from "../domain/simulation";
import { initialExpoState, advanceExpo, goToScene, scenes } from "./model";
interface ExpoState {
  simulation: SimulationControlState;
  selected: string;
  recorded: boolean;
  next: () => void;
  go: (n: number) => void;
  toggle: () => void;
  reset: () => void;
  select: (id: string) => void;
  record: () => void;
}
export const useExpoStore = create<ExpoState>()(
  persist(
    (set) => ({
      simulation: initialExpoState(),
      selected: "b",
      recorded: false,
      next: () => set((s) => ({ simulation: advanceExpo(s.simulation) })),
      go: (n) => set((s) => ({ simulation: goToScene(s.simulation, n) })),
      toggle: () =>
        set((s) => ({
          ...(s.simulation.currentStep === scenes.length - 1
            ? { recorded: false, selected: "b" }
            : {}),
          simulation:
            s.simulation.currentStep === scenes.length - 1
              ? { ...initialExpoState(), status: "running" }
              : {
                  ...s.simulation,
                  status:
                    s.simulation.status === "running" ? "paused" : "running",
                },
        })),
      reset: () =>
        set({ simulation: initialExpoState(), selected: "b", recorded: false }),
      select: (selected) => set({ selected }),
      record: () => set({ recorded: true }),
    }),
    {
      name: "tambaqu-expo-v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        simulation: { ...s.simulation, status: "paused" },
        selected: s.selected,
        recorded: s.recorded,
      }),
      merge: (saved, current) => {
        const s = saved as Partial<ExpoState> | undefined;
        return {
          ...current,
          ...(s?.simulation &&
          Number.isInteger(s.simulation.currentStep) &&
          s.simulation.currentStep >= 0 &&
          s.simulation.currentStep < scenes.length
            ? {
                simulation: {
                  ...initialExpoState(),
                  currentStep: s.simulation.currentStep,
                  status: "paused" as const,
                },
                selected: ["a", "b", "c"].includes(s.selected ?? "")
                  ? s.selected!
                  : "b",
                recorded: s.recorded === true,
              }
            : {}),
        };
      },
    },
  ),
);
