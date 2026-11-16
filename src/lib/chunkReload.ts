// After a new deploy, chunk file names change. A tab opened before the deploy
// still points at the old names, so lazy-loading a screen fails with
// "Failed to fetch dynamically imported module". The fix is a page reload,
// which picks up the new index.html. Reload at most once per 30 s to avoid
// a loop if the failure has another cause (e.g. offline).

const KEY = 'omniplan-chunk-reload-at';
const WINDOW_MS = 30_000;

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError/i;

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err ?? '');
  return CHUNK_ERROR.test(msg);
}

/** Reloads the page unless it already did so recently. Returns true if a reload was started. */
export function reloadOnceForNewVersion(): boolean {
  let last = 0;
  try { last = Number(sessionStorage.getItem(KEY)) || 0; } catch { /* storage unavailable */ }
  if (Date.now() - last < WINDOW_MS) return false;
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* storage unavailable */ }
  window.location.reload();
  return true;
}
