/**
 * Where an image's visible (non-transparent) content starts, as a fraction
 * of its height. Measured once per URL on a small canvas and cached.
 */
const cache = new Map<string, number>();
const pending = new Map<string, Promise<number>>();

export function knownTop(url: string | null | undefined) {
  return url ? cache.get(url) : undefined;
}

export function measureTop(url: string): Promise<number> {
  const hit = cache.get(url);
  if (hit !== undefined) return Promise.resolve(hit);
  const p = pending.get(url);
  if (p) return p;
  const job = new Promise<number>((resolve) => {
    const img = new Image();
    img.onload = () => {
      let top = 0;
      try {
        const h = 160, w = Math.max(1, Math.round((img.naturalWidth / img.naturalHeight) * h));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d')!; g.drawImage(img, 0, 0, w, h);
        const px = g.getImageData(0, 0, w, h).data;
        outer: for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 16) { top = y / h; break outer; }
      } catch { /* tainted or unsupported: assume full height */ }
      cache.set(url, top);
      resolve(top);
    };
    img.onerror = () => { cache.set(url, 0); resolve(0); };
    img.src = url;
  });
  pending.set(url, job);
  return job;
}
