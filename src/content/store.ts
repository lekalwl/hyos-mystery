import { useSyncExternalStore } from 'react';
import { placeholder } from '../lib/placeholder';
import { seedContent } from './seed';
import { blobGet, blobKeys, idbGet, idbSet } from './idb';
import type { AssetDef, CharacterDef, ContentData, PhotoCrop } from './types';
import { defaultOutfit, findSprite } from './sprites';

/**
 * Content store.
 *
 * Load order:
 *   1. built-in seed (always available)
 *   2. content/content.json next to the site, if published
 *   3. the operator's editor draft in this browser (IndexedDB) — only when
 *      this browser has unlocked the editor
 */
type Source = 'seed' | 'published' | 'draft';
interface State {
  data: ContentData; source: Source; ready: boolean; urls: Record<string, string>;
  /** The site's published content, when it is newer than this browser's draft. */
  newerPublished?: ContentData | null;
}

let state: State = { data: seedContent(), source: 'seed', ready: false, urls: {} };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export const OPERATOR_FLAG = 'grayhaven:operator';
export const isOperatorBrowser = () => { try { return localStorage.getItem(OPERATOR_FLAG) === '1'; } catch { return false; } };

const DRAFT_KEY = 'draft';

async function hydrateBlobs(data: ContentData) {
  const urls: Record<string, string> = {};
  const keys = new Set(((await blobKeys()) ?? []).map(String));
  await Promise.all(
    data.assets.filter((a) => !a.src && keys.has(a.id)).map(async (a) => {
      const b = await blobGet(a.id);
      if (b) urls[a.id] = URL.createObjectURL(b);
    }),
  );
  return urls;
}

export async function loadContent() {
  let data = seedContent();
  let source: Source = 'seed';
  try {
    const r = await fetch('content/content.json', { cache: 'no-cache' });
    if (r.ok) {
      const j = (await r.json()) as ContentData;
      if (j && j.version === 1) { data = j; source = 'published'; }
    }
  } catch { /* not published yet */ }

  let urls: Record<string, string> = {};
  let newerPublished: ContentData | null = null;
  if (isOperatorBrowser()) {
    const draft = await idbGet<ContentData>(DRAFT_KEY);
    if (draft && draft.version === 1) {
      // keep the draft, but flag a newer published version so the editor can offer it
      if (source === 'published' && (data.updatedAt ?? 0) > (draft.updatedAt ?? 0)) newerPublished = data;
      data = draft;
      source = 'draft';
      urls = await hydrateBlobs(draft);
    }
  }
  state = { data, source, ready: true, urls, newerPublished };
  emit();
}

/** Throw away this browser's draft and continue from the site's published content. */
export async function usePublishedContent() {
  try {
    const r = await fetch('content/content.json', { cache: 'no-cache' });
    if (!r.ok) return false;
    const j = (await r.json()) as ContentData;
    if (!j || j.version !== 1) return false;
    await idbSet(DRAFT_KEY, j);
    state = { data: j, source: 'draft', ready: true, urls: {}, newerPublished: null };
    emit();
    return true;
  } catch {
    return false;
  }
}

/* ───── editor writes (draft) ───── */
let saveTimer: number | undefined;
export function updateContent(fn: (d: ContentData) => ContentData) {
  const next = { ...fn(state.data), updatedAt: Date.now() };
  state = { ...state, data: next, source: 'draft', newerPublished: null };
  emit();
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { idbSet(DRAFT_KEY, next).catch(() => undefined); }, 350);
}
export function setAssetUrl(id: string, url: string | null) {
  const urls = { ...state.urls };
  if (url) urls[id] = url; else delete urls[id];
  state = { ...state, urls };
  emit();
}
export async function replaceContent(data: ContentData, urls: Record<string, string>) {
  state = { data, source: 'draft', ready: true, urls };
  await idbSet(DRAFT_KEY, data);
  emit();
}
export const getContent = () => state;

/* ───── reading ───── */
const phCache = new Map<string, string>();
function placeholderFor(token: string, data: ContentData) {
  const hit = phCache.get(token);
  if (hit) return hit;
  const [, kind, a, b] = token.split(':');
  const hue = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  const charName = (id: string) => data.characters.find((c) => c.id === id)?.name ?? id;
  let url: string;
  switch (kind) {
    case 'sprite': url = placeholder(600, 1100, `${charName(a)} · ${b}`, 'sprite', hue(a)); break;
    case 'portrait': url = placeholder(480, 600, charName(a), 'portrait', hue(a)); break;
    case 'item': url = placeholder(800, 800, a, 'illustration', hue(a)); break;
    case 'cg': url = placeholder(1920, 1080, a, 'illustration', hue(a)); break;
    default: url = placeholder(1920, 1080, a, 'background', hue(a));
  }
  phCache.set(token, url);
  return url;
}

/** URL for an asset id or a `ph:` token. Audio placeholders resolve to null. */
export function assetUrl(idOrToken: string | null | undefined): string | null {
  if (!idOrToken) return null;
  if (idOrToken.startsWith('ph:')) {
    if (idOrToken.startsWith('ph:bgm') || idOrToken.startsWith('ph:se')) return null;
    return placeholderFor(idOrToken, state.data);
  }
  const a = state.data.assets.find((x) => x.id === idOrToken);
  if (!a) return null;
  return a.src ?? state.urls[a.id] ?? null;
}

export const spriteUrl = (charId: string, expr = '기본', outfit?: string) => {
  const c = state.data.characters.find((x) => x.id === charId);
  const o = outfit ?? (c ? defaultOutfit(c, state.data.assets) : '기본');
  const { asset } = findSprite(state.data.assets, charId, o, expr);
  const a = asset ?? state.data.assets.find((x) => x.kind === 'sprite' && x.character === charId);
  return a ? assetUrl(a.id) : assetUrl(`ph:sprite:${charId}:${o} · ${expr}`);
};
/** Portrait for the case board; falls back to the default sprite, then a placeholder. */
export const portraitUrl = (c: CharacterDef) => {
  const a = state.data.assets.find((x) => x.kind === 'portrait' && x.character === c.id);
  if (a) return assetUrl(a.id);
  const { asset } = findSprite(state.data.assets, c.id, defaultOutfit(c, state.data.assets), '기본');
  return asset ? assetUrl(asset.id) : assetUrl(`ph:portrait:${c.id}`);
};
export const assetById = (id: string): AssetDef | undefined => state.data.assets.find((a) => a.id === id);

export function useContent() {
  return useSyncExternalStore(subscribe, () => state);
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Source image + framing for a character's case-board photo (4:3). */
export function boardPhoto(c: CharacterDef) {
  const assets = state.data.assets;
  const asset = assets.find((x) => x.kind === 'portrait' && x.character === c.id)
    ?? findSprite(assets, c.id, defaultOutfit(c, assets), '기본').asset;
  const url = asset ? assetUrl(asset.id) : assetUrl(`ph:portrait:${c.id}`);
  const ratio = asset?.width && asset?.height ? asset.height / asset.width : 1.25; // h / w
  const tall = ratio > 1.3;
  const crop: PhotoCrop = c.photoCrop ?? (tall
    ? { cx: 0.5, cy: Math.min(0.9, (asset?.top ?? 0.05) + 0.16), zoom: 1.4 }
    : { cx: 0.5, cy: 0.5, zoom: 1 });
  return { url, ratio, crop };
}

/** Inline style that places the image inside a 4:3 frame according to crop. */
export function cropStyle(crop: PhotoCrop, ratio: number): Record<string, string> {
  const imgHOverBoxH = (crop.zoom * ratio) / 0.75;
  return {
    position: 'absolute',
    width: `${crop.zoom * 100}%`,
    maxWidth: 'none',
    height: 'auto',
    left: `${(0.5 - crop.cx * crop.zoom) * 100}%`,
    top: `${(0.5 - crop.cy * imgHOverBoxH) * 100}%`,
  };
}
