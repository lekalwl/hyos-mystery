/**
 * Background music (looping, cross-faded) and one-shot sound effects.
 * Browsers only allow sound after the reader interacts; the first click
 * that advances a line counts, so music starts from the second line at
 * the latest.
 */
const KEY = 'grayhaven:audio';
interface Prefs { muted: boolean; bgm: number; se: number }

const load = (): Prefs => {
  try { return { muted: false, bgm: 0.6, se: 0.8, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { muted: false, bgm: 0.6, se: 0.8 }; }
};

class AudioManager {
  prefs = load();
  private bgmEl: HTMLAudioElement | null = null;
  private bgmSrc: string | null = null;
  /** per-track gain on top of the bgm volume (menu music plays quieter) */
  private bgmGain = 1;
  private target() { return this.prefs.muted ? 0 : this.prefs.bgm * this.bgmGain; }
  private listeners = new Set<() => void>();

  subscribe(l: () => void) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  private save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.prefs)); } catch { /* ignore */ }
    this.listeners.forEach((l) => l());
  }
  setMuted(m: boolean) {
    this.prefs = { ...this.prefs, muted: m };
    if (this.bgmEl) this.bgmEl.volume = this.target();
    this.save();
  }
  setBgmVolume(v: number) {
    this.prefs = { ...this.prefs, bgm: Math.max(0, Math.min(1, v)) };
    if (this.bgmEl) this.bgmEl.volume = this.target();
    this.save();
  }
  setSeVolume(v: number) {
    this.prefs = { ...this.prefs, se: Math.max(0, Math.min(1, v)) };
    this.save();
  }

  playBgm(src: string | null, gain = 1) {
    if (src === this.bgmSrc) {
      if (gain !== this.bgmGain) { this.bgmGain = gain; if (this.bgmEl) this.bgmEl.volume = this.target(); }
      return;
    }
    this.bgmGain = gain;
    const old = this.bgmEl;
    this.bgmSrc = src;
    this.bgmEl = null;
    if (old) this.fade(old, 0, 700, () => old.pause());
    if (!src) return;
    const el = new Audio(src);
    el.loop = true;
    el.volume = 0;
    this.bgmEl = el;
    el.play().then(() => this.fade(el, this.target(), 900)).catch(() => {
      // autoplay blocked: retry on the next user gesture
      const retry = () => { if (this.bgmEl === el) el.play().then(() => this.fade(el, this.target(), 900)).catch(() => undefined); };
      window.addEventListener('pointerdown', retry, { once: true });
      window.addEventListener('keydown', retry, { once: true });
    });
  }

  playSe(src: string | null) {
    if (!src || this.prefs.muted || this.prefs.se <= 0) return;
    const el = new Audio(src);
    el.volume = this.prefs.se;
    el.play().catch(() => undefined);
  }

  stopAll() { this.playBgm(null); }

  private fade(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
    const from = el.volume;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(tick); else done?.();
    };
    requestAnimationFrame(tick);
  }
}

export const audio = new AudioManager();
