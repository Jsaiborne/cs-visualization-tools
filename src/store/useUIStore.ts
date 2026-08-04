import { create } from 'zustand';

export type ActiveModule = 'AUTOMATA' | 'REGEX' | 'GRAMMAR' | 'COMPILER_AST';

interface UIState {
  activeModule: ActiveModule;
  isSidebarOpen: boolean;
  activeTab: 'DESIGN' | 'SIMULATE' | 'PRESETS';
  setActiveModule: (module: ActiveModule) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: 'DESIGN' | 'SIMULATE' | 'PRESETS') => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'AUTOMATA',
  isSidebarOpen: true,
  activeTab: 'DESIGN',
  setActiveModule: (activeModule) => set({ activeModule }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
