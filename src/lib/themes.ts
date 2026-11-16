import type { Theme } from '../store/useAppStore';

export interface ThemePreview {
  canvas: string; sidebar: string; sidebarText: string; card: string;
  text: string; accent: string; border: string; serif?: boolean;
}

/** Theme list shared by Settings → Вигляд and the header theme switcher. */
export const THEME_OPTIONS: { id: Theme; label: string; preview: ThemePreview }[] = [
  { id: 'light', label: 'Світла', preview: { canvas: '#f8fafc', sidebar: '#0f172a', sidebarText: '#cbd5e1', card: '#ffffff', text: '#1e293b', accent: '#4f46e5', border: '#e2e8f0' } },
  { id: 'dark', label: 'Темна', preview: { canvas: '#0f172a', sidebar: '#0f172a', sidebarText: '#94a3b8', card: '#1e293b', text: '#e2e8f0', accent: '#6366f1', border: '#334155' } },
  { id: 'claude', label: 'Claude', preview: { canvas: '#faf9f5', sidebar: '#f0eee6', sidebarText: '#3d3d3a', card: '#ffffff', text: '#30302e', accent: '#c6613f', border: '#e5e2d8', serif: true } },
  { id: 'claude-dark', label: 'Claude темна', preview: { canvas: '#262624', sidebar: '#1f1e1d', sidebarText: '#9c978a', card: '#30302e', text: '#e5e2d8', accent: '#d97757', border: '#3d3d3a', serif: true } },
];
