import { useAppStore } from '../store/useAppStore';

// The PWA service worker (vite-plugin-pwa, registerType "autoUpdate") caches the
// app. A new deploy installs a new worker that takes control right away, but the
// open page keeps running the old code until it reloads. Here we:
//  - check for a new version every 30 min and whenever the tab becomes visible;
//  - when a new worker takes control, reload — but only once the user is idle
//    (no task modal open, not typing), so nothing in progress is lost.

const CHECK_EVERY_MS = 30 * 60 * 1000;

function isBusy(): boolean {
  if (useAppStore.getState().isTaskModalOpen) return true;
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value.trim().length > 0;
  }
  return false;
}

function whenIdle(fn: () => void): void {
  if (!isBusy()) { fn(); return; }
  const timer = window.setInterval(() => {
    if (!isBusy()) { window.clearInterval(timer); fn(); }
  }, 2000);
}

export function setupPwaUpdates(): void {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;

  // First-ever install also fires controllerchange — don't reload for that.
  const hadController = !!sw.controller;
  let reloading = false;
  sw.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    whenIdle(() => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });

  const check = () => {
    if (!navigator.onLine) return;
    void sw.getRegistration().then(reg => reg?.update()).catch(() => { /* offline or blocked */ });
  };
  window.setInterval(check, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
