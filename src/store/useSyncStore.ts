import { create } from 'zustand';

export type SyncStatus = 'saving' | 'error';

interface SyncStore {
  states: Record<string, SyncStatus>;
  retries: Record<string, () => void>;
  markSaving: (id: string) => void;
  markSaved: (id: string) => void;
  markError: (id: string, retry: () => void) => void;
  clearError: (id: string) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  states: {},
  retries: {},

  markSaving: (id) =>
    set(s => ({ states: { ...s.states, [id]: 'saving' } })),

  markSaved: (id) =>
    set(s => {
      const { [id]: _s, ...states } = s.states;
      const { [id]: _r, ...retries } = s.retries;
      return { states, retries };
    }),

  markError: (id, retry) =>
    set(s => ({
      states: { ...s.states, [id]: 'error' },
      retries: { ...s.retries, [id]: retry },
    })),

  clearError: (id) =>
    set(s => {
      const { [id]: _s, ...states } = s.states;
      const { [id]: _r, ...retries } = s.retries;
      return { states, retries };
    }),
}));
