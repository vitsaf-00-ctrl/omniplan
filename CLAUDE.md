# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (port 3000, HMR enabled)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # TypeScript type-check (no emit)
npm run clean     # Remove dist/ and server.js
```

No test suite exists. Type-checking via `npm run lint` is the primary correctness gate.

**Environment:** Create `.env.local` with `GEMINI_API_KEY=...` for AI voice features.

## Architecture

OmniPlan is a task management SPA (React 19 + TypeScript + Tailwind v4) with Firebase backend and AI features.

**Auth flow:** Firebase Google OAuth → `AuthProvider` sets user in `useAppStore` → `FirestoreSync` subscribes to `users/{uid}/tasks` in Firestore.

**State management (Zustand):**
- `src/store/useAppStore.ts` — UI state: active view, theme, modal open/close, clipboard, keyboard selection
- `src/store/useTaskStore.ts` — Task data: CRUD, filtering selectors, recurring task logic

Mutations update the local store then call `syncTask(get, id)` which writes to Firestore via `fsSetTask()` if a `userId` is present.

**Navigation:** `activeView` string in `useAppStore` is the primary nav mechanism (not React Router). `Dashboard.tsx` renders the appropriate screen based on this value.

**Screens** (`src/screens/`) are full-page views. **Components** (`src/components/`) are reusable pieces and global overlays (modals, context menus).

## Key Files

| File | Role |
|---|---|
| `src/lib/taskFirestore.ts` | Firestore CRUD, real-time subscriptions, serialization (Task ↔ Firestore doc) |
| `src/components/FirestoreSync.tsx` | Subscribes to Firestore on mount; triggers recurring task generation on first load |
| `src/components/TaskModal.tsx` | Global create/edit modal; tracks unsaved changes and prompts on Esc |
| `src/hooks/useKeyboardShortcuts.ts` | App-wide keyboard bindings (N, Enter, Space, Delete, Ctrl+C/X/V, T, M) |
| `src/utils/export.ts` | Excel/PDF export |

## Conventions & Non-Obvious Patterns

**Task IDs:** `task_{Date.now()}_{nextId++}` for user-created, `import_{Date.now()}_{nextId++}` for imports, `rec_{parentId}_{dateStr}` for recurring instances.

**Recurring tasks:** `FirestoreSync` calls `scheduleRecurringTasks()` on first load, generating instances 30 days ahead with `recurringParentId` linking them to the parent.

**Clipboard:** `useAppStore` tracks `clipboardTaskId` + `clipboardMode` (copy/cut). Paste duplicates the task; cut also deletes the original.

**Context menu:** `TaskContextMenu` reads selected task from store — it is not passed as props.

**"Someday" tasks:** Tasks with `someday: true` are hidden from all date-based views (Today, Calendar).

**Date serialization:** `taskToDoc()` converts `Date` → Firestore `Timestamp`; `docToTask()` reverses this. Always go through these functions when reading/writing Firestore.

**Keyboard shortcuts:** Only fire when no `<input>` or `<textarea>` is focused. `__setKeyboardSelectedId` / `__notifySelectedId` are window globals used to sync selection state with the keyboard handler.

**Mobile:** Sidebar is hidden on small screens; `MobileTabBar` provides bottom navigation. Touch long-press (500 ms) on a task row opens the context menu.

## UI Language

All UI text is in **Ukrainian**. Use `date-fns` with the `uk` locale for date formatting. Status labels: "Готово", "В процесі", "Заплановано".

## Tech Stack Highlights

- **Tailwind v4** via `@tailwindcss/vite` — custom theme in `src/index.css`; dark mode via `.dark` class on `<html>`
- **Motion** (Framer Motion alternative) for animations
- **Lucide React** for icons
- **@hello-pangea/dnd** for drag-and-drop
- **@google/genai** (Gemini) for voice input (`VoiceInputWidget`)
- **XLSX** for Excel export
