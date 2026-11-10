import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AssetDef, AssetKind, ContentData } from '../content/types';
import { KIND_LABEL } from '../content/types';
import { assetUrl } from '../content/store';
import { isAudio } from './assets';

/**
 * Modal that lists only one kind of library file (backgrounds, music…)
 * so the script palette doesn't have to show everything at once.
 */
export function AssetPicker({ kind, data, onPick, onClose, footer, current, title }: {
  kind: AssetKind;
  data: ContentData;
  onPick: (a: AssetDef) => void;
  onClose: () => void;
  footer?: ReactNode;
  current?: string;
  title?: string;
}) {
  const [q, setQ] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const list = useMemo(
    () => data.assets
      .filter((a) => a.kind === kind && a.name.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [data.assets, kind, q],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); audioRef.current?.pause(); };
  }, [onClose]);

  const toggle = (a: AssetDef) => {
    audioRef.current?.pause();
    if (playing === a.id) { setPlaying(null); return; }
    const url = assetUrl(a.id);
    if (!url) return;
    const el = new Audio(url);
    el.volume = 0.6;
    el.onended = () => setPlaying(null);
    void el.play();
    audioRef.current = el;
    setPlaying(a.id);
  };

  return (
    <div className="ed-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ed-modal" role="dialog" aria-modal="true" aria-label={title ?? `${KIND_LABEL[kind]} 고르기`}>
        <header className="ed-modal-head">
          <h3>{title ?? `${KIND_LABEL[kind]} 고르기`}</h3>
          <input className="ed-input" placeholder="이름으로 찾기" value={q} onChange={(e) => setQ(e.target.value)} autoFocus aria-label="이름으로 찾기" />
          <button type="button" className="text-btn light" onClick={onClose}>닫기</button>
        </header>
        {list.length === 0 ? (
          <p className="ed-empty">{q ? '찾는 이름이 없습니다.' : `라이브러리에 ${KIND_LABEL[kind]}이(가) 없습니다. 라이브러리 탭에서 먼저 올려 주세요.`}</p>
        ) : isAudio(kind) ? (
          <ul className="ed-pick-audio">
            {list.map((a) => (
              <li key={a.id} className={a.id === current ? 'is-current' : undefined}>
                <button type="button" className="text-btn light" onClick={() => toggle(a)} aria-label={playing === a.id ? '정지' : '들어보기'}>{playing === a.id ? '■' : '▶'}</button>
                <span>{a.name}</span>
                <button type="button" className="seal-btn small" onClick={() => onPick(a)}>넣기</button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="ed-pick-grid">
            {list.map((a) => (
              <li key={a.id}>
                <button type="button" className={a.id === current ? 'is-current' : undefined} onClick={() => onPick(a)}>
                  <span className={`ed-pick-thumb kind-${kind}`}>{assetUrl(a.id) ? <img src={assetUrl(a.id)!} alt="" loading="lazy" /> : null}</span>
                  <span className="ed-pick-name">{a.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {footer && <footer className="ed-modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
