/**
 * What this reader has already seen (spoiler guard for gallery/profiles).
 * Keys: asset ids, plus `char:<id>` for characters who have appeared.
 * Stored per browser; the operator's browser sees everything.
 */
import { useSyncExternalStore } from 'react';
import { isOperatorBrowser } from '../content/store';

const KEY = 'grayhaven:seen';
let seen: Set<string> = (() => {
  try { return new Set<string>(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set<string>(); }
})();
let version = 0;
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

export function markSeen(keys: (string | null | undefined)[]) {
  let changed = false;
  for (const k of keys) if (k && !k.startsWith('ph:') && !seen.has(k)) { seen.add(k); changed = true; }
  if (!changed) return;
  version++;
  listeners.forEach((l) => l());
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify([...seen])); } catch { /* ignore */ } }, 300);
}

export function resetSeen() {
  seen = new Set();
  version++;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

/** Returns a checker; operator browsers may bypass with `all`. */
export function useSeen() {
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => version);
  const operator = isOperatorBrowser();
  return {
    operator,
    has: (key: string, bypass = true) => (bypass && operator ? true : seen.has(key)),
  };
}
