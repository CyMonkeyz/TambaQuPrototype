import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Farm } from "../domain/farm";
import type { User } from "../domain/user";
import { DEFAULT_DEMO_POND_ID } from "../constants/demo";

interface AppState {
  activeUser: User | null;
  activeFarm: Farm | null;
  selectedPondId: string | null;
  sidebarCollapsed: boolean;
  demoMode: boolean;
  enterDemo: (user: User, farm: Farm) => void;
  leaveSession: () => void;
  selectPond: (pondId: string | null) => void;
  toggleSidebar: () => void;
}

type PersistedSession = Pick<
  AppState,
  | "activeUser"
  | "activeFarm"
  | "selectedPondId"
  | "sidebarCollapsed"
  | "demoMode"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.role === "string" &&
    Array.isArray(value.farmIds) &&
    value.farmIds.every((id) => typeof id === "string")
  );
}

function isFarm(value: unknown): value is Farm {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.location === "string" &&
    typeof value.ownerId === "string" &&
    Array.isArray(value.pondIds) &&
    value.pondIds.every((id) => typeof id === "string")
  );
}

export function normalizePersistedSession(value: unknown): PersistedSession {
  const input = isRecord(value) ? value : {};
  const activeUser = isUser(input.activeUser) ? input.activeUser : null;
  const activeFarm = isFarm(input.activeFarm) ? input.activeFarm : null;
  const hasValidSession = Boolean(activeUser && activeFarm);
  return {
    activeUser: hasValidSession ? activeUser : null,
    activeFarm: hasValidSession ? activeFarm : null,
    selectedPondId:
      hasValidSession && typeof input.selectedPondId === "string"
        ? input.selectedPondId
        : hasValidSession
          ? DEFAULT_DEMO_POND_ID
          : null,
    sidebarCollapsed:
      typeof input.sidebarCollapsed === "boolean"
        ? input.sidebarCollapsed
        : false,
    demoMode: hasValidSession && input.demoMode === true,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeUser: null,
      activeFarm: null,
      selectedPondId: null,
      sidebarCollapsed: false,
      demoMode: false,
      enterDemo: (activeUser, activeFarm) =>
        set({
          activeUser,
          activeFarm,
          selectedPondId: DEFAULT_DEMO_POND_ID,
          demoMode: true,
        }),
      leaveSession: () =>
        set({
          activeUser: null,
          activeFarm: null,
          selectedPondId: null,
          demoMode: false,
        }),
      selectPond: (selectedPondId) => set({ selectedPondId }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "tambaqu-session",
      version: 1,
      migrate: (persistedState) => normalizePersistedSession(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedSession(persistedState),
      }),
      partialize: ({
        activeUser,
        activeFarm,
        selectedPondId,
        sidebarCollapsed,
        demoMode,
      }) => ({
        activeUser,
        activeFarm,
        selectedPondId,
        sidebarCollapsed,
        demoMode,
      }),
    },
  ),
);
