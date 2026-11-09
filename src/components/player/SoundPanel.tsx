import { useSyncExternalStore } from 'react';
import { audio } from '../../engine/audio';
import { IconClose } from './icons';

/** Background-music / sound-effect volume, kept per browser. */
export function SoundPanel({ onClose }: { onClose: () => void }) {
  const prefs = useSyncExternalStore((l) => audio.subscribe(l), () => audio.prefs);

  // short tick so the effect volume can be heard while sliding
  const tick = (v: number) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.15 * v;
      o.connect(g).connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12); o.stop(ctx.currentTime + 0.13);
      o.onended = () => ctx.close();
    } catch { /* ignore */ }
  };

  return (
    <section className="sound-panel" role="dialog" aria-label="소리 설정">
      <header>
        <h2>소리 설정</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기"><IconClose /></button>
      </header>
      <div className="sp-row">
        <label htmlFor="sp-bgm">배경음</label>
        <input id="sp-bgm" type="range" min={0} max={100} value={Math.round(prefs.bgm * 100)} disabled={prefs.muted}
          onChange={(e) => audio.setBgmVolume(Number(e.target.value) / 100)} />
        <output htmlFor="sp-bgm">{Math.round(prefs.bgm * 100)}</output>
      </div>
      <div className="sp-row">
        <label htmlFor="sp-se">효과음</label>
        <input id="sp-se" type="range" min={0} max={100} value={Math.round(prefs.se * 100)} disabled={prefs.muted}
          onChange={(e) => audio.setSeVolume(Number(e.target.value) / 100)}
          onPointerUp={(e) => tick(Number((e.target as HTMLInputElement).value) / 100)} />
        <output htmlFor="sp-se">{Math.round(prefs.se * 100)}</output>
      </div>
      <label className="sp-mute">
        <input type="checkbox" checked={prefs.muted} onChange={(e) => audio.setMuted(e.target.checked)} />
        소리 모두 끄기 <kbd>S</kbd>
      </label>
    </section>
  );
}
