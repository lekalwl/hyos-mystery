import { useEffect, useSyncExternalStore } from 'react';
import { audio } from '../engine/audio';

/** Quiet music for the desk and menu pages, with a small sound toggle. */
const MENU_GAIN = 0.4;

export function MenuMusic({ src }: { src: string | null }) {
  const muted = useSyncExternalStore((l) => audio.subscribe(l), () => audio.prefs.muted);
  useEffect(() => { audio.playBgm(src, MENU_GAIN); }, [src]);
  if (!src) return null;
  return (
    <button
      type="button"
      className="menu-sound"
      aria-pressed={!muted}
      aria-label={muted ? '음악 켜기' : '음악 끄기'}
      onClick={() => audio.setMuted(!muted)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        {muted
          ? <path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          : <path d="M16 9 C17.5 10.5 17.5 13.5 16 15 M18.5 6.5 C21.5 9.5 21.5 14.5 18.5 17.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
      </svg>
    </button>
  );
}
