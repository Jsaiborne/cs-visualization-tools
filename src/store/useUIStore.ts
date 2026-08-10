import { create } from 'zustand';

export type ActiveModule = 'HOME' | 'AUTOMATA' | 'REGEX' | 'GRAMMAR' | 'COMPILER_AST';

interface UIState {
  activeModule: ActiveModule;
  isSidebarOpen: boolean;
  activeTab: 'DESIGN' | 'SIMULATE' | 'PRESETS';
  toastMessage: string | null;
  setActiveModule: (module: ActiveModule) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: 'DESIGN' | 'SIMULATE' | 'PRESETS') => void;
  showToast: (msg: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'HOME',
  isSidebarOpen: true,
  activeTab: 'DESIGN',
  toastMessage: null,
  setActiveModule: (activeModule) => set({ activeModule }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },
}));
