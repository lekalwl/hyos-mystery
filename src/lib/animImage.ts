/**
 * Animated illustrations (GIF / animated WebP) can be shown looping or
 * played once, stopping on the last frame. The loop setting lives inside
 * the file, so we rewrite those few bytes and show the edited copy.
 */
export type PlayMode = 'loop' | 'once';

const bytesCache = new Map<string, Promise<Uint8Array | null>>();

const ascii = (b: Uint8Array, at: number, s: string) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0));

function gifWithLoop(src: Uint8Array, mode: PlayMode): Uint8Array | null {
  if (!ascii(src, 0, 'GIF8')) return null;
  // find the NETSCAPE2.0 looping block, if any
  let ext = -1;
  for (let i = 13; i < src.length - 19; i++) {
    if (src[i] === 0x21 && src[i + 1] === 0xff && src[i + 2] === 0x0b && ascii(src, i + 3, 'NETSCAPE2.0')) { ext = i; break; }
  }
  if (mode === 'once') {
    if (ext < 0) return src; // no block = plays once already
    const out = new Uint8Array(src.length - 19);
    out.set(src.subarray(0, ext));
    out.set(src.subarray(ext + 19), ext);
    return out;
  }
  if (ext >= 0) {
    const out = src.slice();
    out[ext + 16] = 0; out[ext + 17] = 0; // loop count 0 = forever
    return out;
  }
  // insert a looping block right after the header and global colour table
  const flags = src[10];
  const at = 13 + (flags & 0x80 ? 3 * (1 << ((flags & 7) + 1)) : 0);
  const block = new Uint8Array([0x21, 0xff, 0x0b, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 0x03, 0x01, 0, 0, 0]);
  const out = new Uint8Array(src.length + block.length);
  out.set(src.subarray(0, at)); out.set(block, at); out.set(src.subarray(at), at + block.length);
  return out;
}

function webpWithLoop(src: Uint8Array, mode: PlayMode): Uint8Array | null {
  if (!ascii(src, 0, 'RIFF') || !ascii(src, 8, 'WEBP')) return null;
  for (let i = 12; i + 8 <= src.length;) {
    const size = src[i + 4] | (src[i + 5] << 8) | (src[i + 6] << 16) | (src[i + 7] << 24);
    if (ascii(src, i, 'ANIM')) {
      const out = src.slice();
      const n = mode === 'once' ? 1 : 0;
      out[i + 12] = n & 0xff; out[i + 13] = n >> 8;
      return out;
    }
    i += 8 + size + (size & 1);
  }
  return null; // not animated
}

/** A blob URL of the file set to loop / play once, or null to use the original. */
export async function playVariant(url: string, mode: PlayMode, mime?: string): Promise<string | null> {
  if (!/gif|webp/i.test(mime ?? url) && !url.startsWith('blob:')) return null;
  let p = bytesCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => (b ? new Uint8Array(b) : null)).catch(() => null);
    bytesCache.set(url, p);
  }
  const src = await p;
  if (!src) return null;
  const out = gifWithLoop(src, mode) ?? webpWithLoop(src, mode);
  if (!out) return null;
  const type = ascii(src, 0, 'GIF8') ? 'image/gif' : 'image/webp';
  // a fresh URL every time, so a play-once animation starts from the first frame
  return URL.createObjectURL(new Blob([out], { type }));
}
