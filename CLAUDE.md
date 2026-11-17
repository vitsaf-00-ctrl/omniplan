# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (port 3000, HMR)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run lint         # TypeScript type-check (tsc --noEmit)
npm run lint:eslint  # ESLint
npm test             # Vitest (src/**/*.test.ts, server/**/*.test.ts)
```

Before committing run `npm run lint`, `npm run lint:eslint`, `npm test` and `npm run build`.
A local pre-commit hook (`.git/hooks/pre-commit`, not versioned) runs tsc + ESLint.

Firebase web config is in `firebase-applet-config.json`. The only env var is `FIREBASE_SERVICE_ACCOUNT`
(Vercel, server only) for the MCP server; the web app needs none.
Deploy: every push to `main` is auto-deployed by Vercel.

## Architecture

Task-management SPA: React 19 + TypeScript + Tailwind v4, Firebase Auth (Google) + Firestore, PWA (vite-plugin-pwa).

**Auth flow:** Google OAuth → `AuthProvider` sets user in `useAppStore` → `FirestoreSync` subscribes to
`users/{uid}/tasks` and `users/{uid}/projects`. It only subscribes — it does not generate tasks.

**State (Zustand):**
- `src/store/useTaskStore.ts` — tasks, projects, CRUD, selectors, recurring logic. Wrapped in `zundo`
  `temporal` (undo/redo of `tasks`, limit 50); Firestore snapshots pause the history.
- `src/store/useAppStore.ts` — UI state: active view, theme, modals, clipboard, keyboard selection.
- `src/store/useSyncStore.ts` — per-task save state (saving / saved / error + retry) for `SyncIndicator`.
- `src/store/useToastStore.ts` — toasts (`ToastContainer`).

Mutations update the store first, then `syncTask(get, id)` → `fsSetTask()` (or `syncDelete`). Errors mark the
task in `useSyncStore` and show a toast with "Повторити".

**Navigation:** `activeView` in `useAppStore` (no router). `Dashboard.tsx` lazy-loads screens, each wrapped in
`ErrorBoundary` (reset on view change); the app root is wrapped too (`main.tsx`).

**MCP server for AI assistants (Claude, ChatGPT):** `api/mcp.ts` (Vercel function, Web `Request`/`Response`)
→ `server/mcp/handler.ts` (auth + stateless Streamable HTTP transport) → `server/mcp/server.ts` (tool definitions)
→ `server/mcp/ops.ts` (task logic over a `TaskRepo`; Firestore Admin in `firestoreRepo.ts`, in-memory in tests).
Auth: personal tokens `omni.<uid>.<secret>` created in Settings → Інтеграції; only SHA-256(secret) is stored in
`users/{uid}.mcpTokens[hash]` (`src/lib/mcpToken.ts`, shared by app and server). Token comes from `Authorization:
Bearer`, `X-OmniPlan-Token` or `?token=`. The server runs in `Europe/Kyiv` (`server/mcp/tz.ts`, imported first) so
dates match the app. `ops.ts` mirrors the app's recurrence rules — change both together. Server imports of
local files must use `.js` extensions (Vercel runs them as ESM, file by file).

## Key Files

| File | Role |
|---|---|
| `src/lib/taskFirestore.ts` | Firestore CRUD, subscriptions, `taskToDoc()` / `docToTask()` serialization |
| `src/utils/recurrence.ts` | Recurrence date math (`nextOccurrence`, `nextInstanceDate`) — tested |
| `src/utils/parseTaskInput.ts` | Ukrainian natural-language Quick Add parser — tested |
| `src/components/TaskModal.tsx` | Create/edit modal; unsaved-changes guard on Esc; "stop repeating" |
| `src/hooks/useKeyboardShortcuts.ts` | App-wide shortcuts |
| `src/hooks/useUndoRedo.ts` | Undo/redo + Firestore batch sync of the diff |
| `src/hooks/useReminderNotifications.ts` | Browser notifications for tasks with `time` + `notifyAtTime` (tab must be open) |
| `src/screens/settings/*` | One file per Settings tab; `Settings.tsx` only wires them |
| `src/utils/export.ts` | Excel/PDF export |

## Conventions & Non-Obvious Patterns

**Task IDs:** `task_<uuid>` (created), `import_<uuid>` (imported), `rec_<uuid>` (recurring instance).
Legacy ids `rec_<parentId>_<yyyy-mm-dd>` may exist in old data.

**Recurring tasks — "next copy on completion":** nothing is pre-generated. When a task with `recurring: true`
moves to `done` (via `moveTask` or `updateTask`), `handleRecurringTransition` creates exactly one next instance
(`recurringParentId` = series root id) and stores its id in the completed task's `recurringNextId`. No copy is
created if one already exists that day (same series, or same title+project for legacy data). Moving the task back
out of `done` deletes the spawned copy if it is still untouched. "Stop repeating" turns `recurring` off for the
whole series and deletes future not-done copies. Do not reintroduce bulk pre-generation — it caused duplicates.

**Projects:** `PROJECTS` in `useTaskStore` is only a seed list. For pickers/filters always read
`useTaskStore(s => s.projects)` (live, from Firestore).

**Firestore serialization:** add every new `Task` field to both `taskToDoc()` and `docToTask()` — a field missing
from either is silently lost. The MCP server has its own copy (`server/mcp/serialize.ts`) — update it too.

**Clipboard:** `useAppStore` tracks `clipboardTaskId` + `clipboardMode` (copy/cut).

**Context menu:** `TaskContextMenu` reads the selected task from the store, not props.

**"Someday" tasks:** `someday: true` hides a task from all date-based views.

**Keyboard shortcuts:** fire only when no input/textarea is focused. `window.__setKeyboardSelectedId` /
`__notifySelectedId` sync selection with the handler.

**Mobile:** sidebar hidden on small screens; `MobileTabBar` is the bottom nav; long-press (500 ms) opens the
context menu.

**Colours:** UI accent = `indigo-*` (remapped to clay by the Claude theme). Project tag colour "indigo" uses
`tag-indigo-*`, which no theme remaps — never use `indigo-*` for project colours. Task status colours use
`progress-*` (в роботі) and `planned-*` (заплановано); each theme sets them in `src/index.css`.
`taskColorMode` in `useAppStore` switches calendar pills between project colours and status colours.

**Personal data:** never commit task exports (`*.csv` is git-ignored).

## UI Language

All UI text is **Ukrainian**. Use `date-fns` with the `uk` locale. Status labels: "Заплановано", "В процесі",
"Готово".

## Tech Stack Highlights

- Tailwind v4 via `@tailwindcss/vite`; theme in `src/index.css`; dark mode via `.dark` on `<html>`
- Lucide React icons; `@hello-pangea/dnd` for drag-and-drop
- `xlsx` for Excel import/export — heavy chunk; keep it out of the main bundle (only ImportModal and the lazy Statistics screen import it)
