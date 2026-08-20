import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Farm } from '../domain/farm'
import type { User } from '../domain/user'

interface AppState {
  activeUser: User | null
  activeFarm: Farm | null
  selectedPondId: string | null
  sidebarCollapsed: boolean
  demoMode: boolean
  enterDemo: (user: User, farm: Farm) => void
  leaveSession: () => void
  selectPond: (pondId: string | null) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(persist((set) => ({
  activeUser: null,
  activeFarm: null,
  selectedPondId: null,
  sidebarCollapsed: false,
  demoMode: false,
  enterDemo: (activeUser, activeFarm) => set({ activeUser, activeFarm, demoMode: true }),
  leaveSession: () => set({ activeUser: null, activeFarm: null, selectedPondId: null, demoMode: false }),
  selectPond: (selectedPondId) => set({ selectedPondId }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}), {
  name: 'tambaqu-session',
  partialize: ({ activeUser, activeFarm, selectedPondId, sidebarCollapsed, demoMode }) => ({ activeUser, activeFarm, selectedPondId, sidebarCollapsed, demoMode }),
}))
