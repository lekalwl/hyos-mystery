/**
 * "Claude에게 보내기": hands an editor export to Claude through the
 * artifact's own storage, so no download or Drive link is needed.
 *
 * Artifact storage takes images/text but not zip files, so the zip is
 * stored as base64 text in parts; a `handoffs/<id>` row lists the parts.
 */
interface ClaudeHost { use?: (name: string) => Promise<unknown> }
interface AssetsNs { upload(b: Blob, o?: { type?: string }): Promise<{ id: string; sizeBytes: number }> }
interface DbNs { doc(path: string): { set(d: Record<string, unknown>): Promise<void> } }

const PART = 12 * 1024 * 1024; // raw bytes per part (~16 MB as base64, under the 20 MiB cap)

function toBase64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const use = async <T,>(name: string) => {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  return host?.use ? ((await host.use(name).catch(() => null)) as T | null) : null;
};

/** null when this view cannot send (not the artifact page, or not an editor). */
export async function handoffAvailable() {
  return !!(await use<AssetsNs>('assets')) && !!(await use<DbNs>('db'));
}

export async function sendToClaude(zip: Blob, meta: { episodes: string; updatedAt: number }, onProgress?: (done: number, total: number) => void) {
  const assets = await use<AssetsNs>('assets');
  const db = await use<DbNs>('db');
  if (!assets || !db) throw Object.assign(new Error('이 화면에서는 보낼 수 없습니다'), { code: 'unavailable' });
  const bytes = new Uint8Array(await zip.arrayBuffer());
  const total = Math.max(1, Math.ceil(bytes.length / PART));
  const parts: string[] = [];
  for (let i = 0; i < total; i++) {
    onProgress?.(i, total);
    const text = toBase64(bytes.subarray(i * PART, (i + 1) * PART));
    const r = await assets.upload(new Blob([text], { type: 'text/plain' }), { type: 'text/plain' });
    parts.push(r.id);
  }
  onProgress?.(total, total);
  const id = `h${Date.now()}`;
  await db.doc(`handoffs/${id}`).set({ parts, size: bytes.length, episodes: meta.episodes, contentUpdatedAt: meta.updatedAt, sentAt: Date.now() });
  return { id, size: bytes.length };
}
