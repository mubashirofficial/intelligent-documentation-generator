import { create } from 'zustand';
import type { Project } from '@/types';

interface AppStore {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
}));
