/**
 * Per-episode reader data kept in the browser (localStorage).
 * Every access is guarded: private windows or blocked storage simply
 * behave as "nothing saved" instead of breaking the player.
 */
const NS = 'grayhaven';
export const BOOKMARK_SLOTS = 6;

export interface Bookmark {
  slot: number;
  index: number; // script line
  savedAt: number;
  speaker: string | null;
  excerpt: string;
  background?: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${NS}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): boolean {
  try {
    if (value === null) localStorage.removeItem(`${NS}:${key}`);
    else localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const getBookmarks = (ep: string): (Bookmark | null)[] => {
  const list = read<(Bookmark | null)[]>(`bookmarks:${ep}`, []);
  return Array.from({ length: BOOKMARK_SLOTS }, (_, i) => list[i] ?? null);
};
export const setBookmark = (ep: string, b: Bookmark) => {
  const list = getBookmarks(ep);
  list[b.slot] = b;
  return write(`bookmarks:${ep}`, list);
};
export const deleteBookmark = (ep: string, slot: number) => {
  const list = getBookmarks(ep);
  list[slot] = null;
  return write(`bookmarks:${ep}`, list);
};
export const latestBookmark = (ep: string) =>
  getBookmarks(ep).filter((b): b is Bookmark => !!b).sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;

export interface Memo { text: string; updatedAt: number }
export const getMemo = (ep: string): Memo => read<Memo>(`memo:${ep}`, { text: '', updatedAt: 0 });
export const setMemo = (ep: string, text: string) =>
  write(`memo:${ep}`, text ? { text, updatedAt: Date.now() } : null);

/** One-shot hand-off: "open this episode at line N" (from the library page). */
let pendingStart: { ep: string; index: number } | null = null;
export const requestStart = (ep: string, index: number) => { pendingStart = { ep, index }; };
export const takeStart = (ep: string) => {
  const p = pendingStart;
  pendingStart = null;
  return p && p.ep === ep ? p.index : 0;
};

export const formatTime = (ts: number) => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
