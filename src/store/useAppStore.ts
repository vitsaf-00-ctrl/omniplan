import { create } from 'zustand';
import { User } from 'firebase/auth';
import { Task } from './useTaskStore';

export type ActiveView = 'today' | 'calendar' | 'board' | 'tasks' | 'settings' | 'stats' | 'focus';
export type Theme = 'light' | 'dark';

interface AppState {
  user: User | null;
  isAuthLoaded: boolean;
  isMobileMenuOpen: boolean;
  activeView: ActiveView;
  theme: Theme;
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  selectedDate?: Date;
  clipboardTaskId: string | null;
  selectedTaskId: string | null;
  clipboardMode: 'copy' | 'cut' | null;
  focusTaskId: string | null;

  setUser: (u: User | null) => void;
  setAuthLoaded: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  setActiveView: (v: ActiveView) => void;
  setTheme: (v: Theme) => void;
  toggleTheme: () => void;
  setTaskModalOpen: (v: boolean) => void;
  setEditingTask: (t: Task | null) => void;
  setSelectedDate: (d?: Date) => void;
  setClipboard: (id: string, mode: 'copy'|'cut') => void;
  clearClipboard: () => void;
  setSelectedTaskId: (id: string | null) => void;
  setFocusTaskId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null, isAuthLoaded: false, isMobileMenuOpen: false,
  activeView: 'today', theme: 'light',
  isTaskModalOpen: false, editingTask: null, selectedDate: undefined,
  clipboardTaskId: null, clipboardMode: null, focusTaskId: null, selectedTaskId: null,

  setUser: u => set({ user: u }),
  setAuthLoaded: v => set({ isAuthLoaded: v }),
  setMobileMenuOpen: v => set({ isMobileMenuOpen: v }),
  setActiveView: v => set({ activeView: v }),
  setTheme: v => {
    set({ theme: v });
    if (v==='dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },
  toggleTheme: () => get().setTheme(get().theme==='light'?'dark':'light'),
  setTaskModalOpen: v => set({ isTaskModalOpen: v }),
  setEditingTask: t => set({ editingTask: t }),
  setSelectedDate: d => set({ selectedDate: d }),
  setClipboard: (id, mode) => set({ clipboardTaskId: id, clipboardMode: mode }),
  clearClipboard: () => set({ clipboardTaskId: null, clipboardMode: null }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setFocusTaskId: id => set({ focusTaskId: id }),
}));
