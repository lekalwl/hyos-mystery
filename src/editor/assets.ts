import { strToU8, unzipSync, zipSync, strFromU8 } from 'fflate';
import { blobGet, blobSet, blobDel } from '../content/idb';
import { getContent, newId, replaceContent, setAssetUrl, updateContent } from '../content/store';
import type { AssetDef, AssetKind, ContentData } from '../content/types';

export const IMAGE_KINDS: AssetKind[] = ['bg', 'cg', 'item', 'sprite', 'portrait'];
export const AUDIO_KINDS: AssetKind[] = ['bgm', 'se'];
export const isAudio = (k: AssetKind) => AUDIO_KINDS.includes(k);

/** Recommended sizes shown next to each upload box. */
export const SIZE_GUIDE: Record<AssetKind, string> = {
  bg: '1920×1080 (16:9) · JPG/WebP',
  cg: '1920×1080 권장, 세로 일러스트도 비율 유지 · JPG/WebP/PNG',
  item: '1000×1000 안팎, 투명 PNG/WebP',
  sprite: '캔버스 1200×2000 고정, 투명 PNG/WebP — 같은 인물의 모든 표정은 같은 캔버스 크기',
  portrait: '800×1000 (4:5) · JPG/WebP',
  bgm: 'MP3/OGG · 반복 재생되는 곡',
  se: 'MP3/OGG/WAV · 짧은 소리',
};

const baseName = (f: File) => f.name.replace(/\.[^.]+$/, '').trim() || '이름없음';

function uniqueName(kind: AssetKind, name: string, assets: AssetDef[], extra?: (a: AssetDef) => boolean) {
  const taken = new Set(assets.filter((a) => a.kind === kind && (!extra || extra(a))).map((a) => a.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  let i = 2;
  while (taken.has(`${name}${i}`.toLowerCase())) i++;
  return `${name}${i}`;
}

/** Size plus where the first non-transparent row is (used to crop faces). */
function imageSize(url: string): Promise<{ width: number; height: number; top?: number } | null> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth, height = img.naturalHeight;
      let top: number | undefined;
      try {
        const h = 200, w = Math.max(1, Math.round((width / height) * h));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d')!; g.drawImage(img, 0, 0, w, h);
        const px = g.getImageData(0, 0, w, h).data;
        outer: for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 16) { top = y / h; break outer; }
      } catch { /* ignore */ }
      res({ width, height, top });
    };
    img.onerror = () => res(null);
    img.src = url;
  });
}

export async function addFiles(files: File[], kind: AssetKind, opts: { character?: string; expression?: string; outfit?: string } = {}) {
  const added: AssetDef[] = [];
  for (const file of files) {
    const id = newId(kind);
    await blobSet(id, file);
    const url = URL.createObjectURL(file);
    const dims = isAudio(kind) ? null : await imageSize(url);
    const assets = getContent().data.assets;
    const asset: AssetDef = {
      id,
      kind,
      name: kind === 'sprite'
        ? `${opts.character}:${opts.outfit ?? '기본'}:${opts.expression ?? baseName(file)}`
        : uniqueName(kind, baseName(file), assets),
      mime: file.type,
      ...(dims ?? {}),
      character: opts.character,
      expression: kind === 'sprite' ? (opts.expression ?? baseName(file)) : undefined,
      outfit: kind === 'sprite' ? (opts.outfit ?? '기본') : undefined,
      gallery: kind === 'cg' || kind === 'sprite' || kind === 'bg' || kind === 'item' ? true : undefined,
      created: Date.now(),
    };
    setAssetUrl(id, url);
    updateContent((d) => ({
      ...d,
      // a new sprite for the same character+expression replaces the old one
      assets: [
        ...d.assets.filter((a) => !(kind === 'sprite' && a.kind === 'sprite' && a.character === opts.character
          && a.expression === asset.expression && (a.outfit || '기본') === asset.outfit)),
        asset,
      ],
    }));
    added.push(asset);
  }
  return added;
}

export async function replaceFile(asset: AssetDef, file: File) {
  await blobSet(asset.id, file);
  const url = URL.createObjectURL(file);
  const dims = isAudio(asset.kind) ? null : await imageSize(url);
  setAssetUrl(asset.id, url);
  updateContent((d) => ({ ...d, assets: d.assets.map((a) => (a.id === asset.id ? { ...a, src: undefined, mime: file.type, ...(dims ?? {}) } : a)) }));
}

export async function removeAsset(id: string) {
  await blobDel(id).catch(() => undefined);
  setAssetUrl(id, null);
  updateContent((d) => ({ ...d, assets: d.assets.filter((a) => a.id !== id) }));
}

/* ───── usage & rename (keeps scripts in sync) ───── */
const DIR_WORDS: Partial<Record<AssetKind, string[]>> = {
  bg: ['배경', 'bg'], cg: ['삽화', '일러스트', 'cg'], item: ['아이템', '증거', 'item'], bgm: ['음악', 'bgm'], se: ['효과음', 'se'],
};
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dirRe = (kind: AssetKind, name: string) =>
  new RegExp(`^(\\s*@(?:${(DIR_WORDS[kind] ?? []).join('|')})\\s+)${esc(name)}(?=\\s*(#|$))`, 'gim');

export function usageCount(a: AssetDef, data: ContentData) {
  if (!DIR_WORDS[a.kind]) return null;
  let n = 0;
  for (const ep of data.episodes) n += (ep.script.match(dirRe(a.kind, a.name)) ?? []).length;
  for (const ep of data.episodes) if (ep.thumbnail === a.id) n++;
  return n;
}

export function renameAsset(a: AssetDef, name: string) {
  const clean = name.trim();
  if (!clean || clean === a.name) return;
  updateContent((d) => ({
    ...d,
    assets: d.assets.map((x) => (x.id === a.id ? { ...x, name: clean } : x)),
    episodes: DIR_WORDS[a.kind]
      ? d.episodes.map((ep) => ({ ...ep, script: ep.script.replace(dirRe(a.kind, a.name), `$1${clean}`) }))
      : d.episodes,
  }));
}

/* ───── export / import ───── */
const EXT: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mp4': 'm4a', 'audio/aac': 'aac',
};
const MIME = Object.fromEntries(Object.entries(EXT).map(([m, e]) => [e, m]));

async function assetBlob(a: AssetDef): Promise<Blob | null> {
  if (a.src) {
    try { return await (await fetch(a.src)).blob(); } catch { return null; }
  }
  return (await blobGet(a.id)) ?? null;
}

/**
 * Builds content.zip:  content/content.json + content/assets/<kind>/<id>.<ext>
 *
 * 'changes' (default): only files that exist just in this browser — new or
 * replaced uploads. Everything already on the site is referenced by its
 * published path, so the zip stays small and is made in seconds.
 * 'all': every file, for a complete offline backup.
 */
export async function exportZip(mode: 'changes' | 'all' = 'changes', onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const data = getContent().data;
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {};
  const todo = data.assets.filter((a) => mode === 'all' || !a.src);
  const out = new Map<string, AssetDef>(data.assets.map((a) => [a.id, a]));
  let done = 0;
  onProgress?.(0, todo.length);
  // a few downloads at a time instead of one by one
  const queue = [...todo];
  const worker = async () => {
    for (let a = queue.shift(); a; a = queue.shift()) {
      const b = await assetBlob(a);
      if (b) {
        const ext = EXT[b.type] ?? EXT[a.mime ?? ''] ?? (a.src?.split('.').pop() || 'bin');
        const path = `content/assets/${a.kind}/${a.id}.${ext}`;
        // media is already compressed: store it as-is (much faster)
        files[path] = [new Uint8Array(await b.arrayBuffer()), { level: 0 }];
        out.set(a.id, { ...a, src: path, mime: b.type || a.mime });
      }
      onProgress?.(++done, todo.length);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  const result: ContentData = { ...data, assets: data.assets.map((a) => out.get(a.id)!), updatedAt: Date.now(), ...(mode === 'changes' ? { partial: true } : {}) };
  files['content/content.json'] = strToU8(JSON.stringify(result, null, 2));
  const zipped = zipSync(files as Parameters<typeof zipSync>[0]);
  return new Blob([zipped], { type: 'application/zip' });
}

export async function importFile(file: File) {
  let data: ContentData;
  const urls: Record<string, string> = {};
  if (file.name.endsWith('.json')) {
    data = JSON.parse(await file.text());
  } else {
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const jsonKey = Object.keys(entries).find((k) => k.endsWith('content.json'));
    if (!jsonKey) throw new Error('zip 안에 content.json이 없습니다');
    const root = jsonKey.slice(0, -'content/content.json'.length);
    data = JSON.parse(strFromU8(entries[jsonKey]));
    for (const a of data.assets) {
      if (!a.src || a.src.startsWith('data:')) continue;
      const bytes = entries[root + a.src];
      if (!bytes) continue;
      const ext = a.src.split('.').pop() ?? '';
      const blob = new Blob([bytes], { type: a.mime || MIME[ext] || '' });
      await blobSet(a.id, blob);
      urls[a.id] = URL.createObjectURL(blob);
      delete a.src;
    }
  }
  if (!data || data.version !== 1) throw new Error('그레이헤이븐 콘텐츠 파일이 아닙니다');
  delete data.partial;
  await replaceContent(data, urls);
}


/* ───── bulk sprite import:  캐이름_의상이름_감정이름.png ───── */
const PALETTE = ['#d8bc83', '#c98a7a', '#8fb3c9', '#a8c48f', '#b49ad1', '#d1a86b', '#7fc4b4', '#d48fb0', '#9aa3d6', '#c9c27a', '#c47f6b', '#8fc9a0'];

export function parseSpriteName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '').trim();
  const parts = base.split('_').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return { name: parts[0], outfit: parts[1], expression: parts.slice(2).join('_') };
  if (parts.length === 2) return { name: parts[0], outfit: '기본', expression: parts[1] };
  return null;
}

export interface SpriteImportReport { created: string[]; updated: string[]; sprites: number; skipped: string[] }

export async function importSpriteFiles(files: File[], opts: { removePlaceholders: boolean }): Promise<SpriteImportReport> {
  const report: SpriteImportReport = { created: [], updated: [], sprites: 0, skipped: [] };
  const images = files.filter((f) => f.type.startsWith('image/'));
  const parsed = images.map((f) => ({ f, p: parseSpriteName(f.name) }));
  for (const { f, p } of parsed) if (!p) report.skipped.push(f.name);

  if (opts.removePlaceholders) {
    const ph = getContent().data.characters.filter((c) => c.placeholder);
    for (const a of getContent().data.assets.filter((x) => ph.some((c) => c.id === x.character))) await removeAsset(a.id);
    updateContent((d) => ({ ...d, characters: d.characters.filter((c) => !c.placeholder) }));
  }

  // natural order so 평상복 comes before 인게임 when both exist
  const outfitRank = (o: string) => (/평상|일상|사복|casual/i.test(o) ? 0 : /인게임|게임|ingame/i.test(o) ? 1 : 2);

  for (const { f, p } of parsed) {
    if (!p) continue;
    let c = getContent().data.characters.find((x) => x.name === p.name || x.aliases.includes(p.name));
    if (!c) {
      const id = newId('ch');
      const n = getContent().data.characters.length;
      c = {
        id, name: p.name, aliases: [], color: PALETTE[n % PALETTE.length], intro: '',
        fields: ['이름', '나이', '직업', '관계'].map((label) => ({ label, value: '' })),
        outfits: [],
      };
      const fresh = c;
      updateContent((d) => ({ ...d, characters: [...d.characters, fresh] }));
      report.created.push(p.name);
    } else if (!report.created.includes(p.name) && !report.updated.includes(p.name)) {
      report.updated.push(p.name);
    }
    const cid = c.id;
    updateContent((d) => ({
      ...d,
      characters: d.characters.map((x) => {
        if (x.id !== cid) return x;
        const outfits = Array.from(new Set([...(x.outfits ?? []), p.outfit])).sort((a, b) => outfitRank(a) - outfitRank(b));
        return { ...x, outfits };
      }),
    }));
    await addFiles([f], 'sprite', { character: cid, outfit: p.outfit, expression: p.expression });
    report.sprites++;
  }
  return report;
}

/** Collect files from a dropped folder (recursively). */
export async function filesFromDrop(dt: DataTransfer): Promise<File[]> {
  const out: File[] = [];
  const entries = [...dt.items].map((i) => (i as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
  if (!entries.length) return [...dt.files];
  const walk = async (e: FileSystemEntry): Promise<void> => {
    if (e.isFile) {
      out.push(await new Promise<File>((res, rej) => (e as FileSystemFileEntry).file(res, rej)));
    } else if (e.isDirectory) {
      const reader = (e as FileSystemDirectoryEntry).createReader();
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        for (const child of batch) await walk(child);
      } while (batch.length);
    }
  };
  for (const e of entries) await walk(e);
  return out;
}
