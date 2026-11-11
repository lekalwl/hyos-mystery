import { useEffect, useRef, useState } from 'react';
import type { Step } from '../../engine/script';
import type { InvestigationDef } from '../../content/types';

/**
 * Dialogue log. Lines up to `upTo` are listed; pick one and press
 * 「여기로 이동」 to continue reading from there.
 */
export function LogView({ steps, upTo, current, invLog, investigations, title, onJump, onClose, page }: {
  steps: Step[];
  upTo: number;
  /** line to scroll to when opened */
  current: number;
  /** dialogue already seen inside investigations, by step index */
  invLog?: Record<number, Step[]>;
  investigations?: InvestigationDef[];
  title?: string;
  onJump: (index: number) => void;
  onClose: () => void;
  /** opened from a page rather than inside the player */
  page?: boolean;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = body.current?.querySelector<HTMLElement>(`[data-i="${current}"]`);
    if (el && body.current) body.current.scrollTop = el.offsetTop - body.current.clientHeight / 2;
  }, [current]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const line = (s: Step, _key: string) => (
    <>
      <span className="log-name" style={s.speaker?.color ? { color: s.speaker.color } : undefined}>{s.speaker ? s.speaker.name : '—'}</span>
      <span className={s.thought ? 'is-thought-log' : undefined}>{s.thought ? `( ${s.text} )` : s.text}</span>
    </>
  );

  return (
    <div className={`vn-log${page ? ' is-page' : ''}`} role="dialog" aria-modal="true" aria-label="대사 기록">
      <div className="vn-log-head">
        <h2>대사 기록{title && <small>{title}</small>}</h2>
        <p className="log-hint">대사를 누르고 「여기로 이동」을 누르면 그 장면부터 읽습니다.</p>
        <button type="button" className="vn-btn" onClick={onClose} autoFocus>닫기</button>
      </div>
      <div className="vn-log-body" ref={body}>
        {steps.slice(0, upTo + 1).map((s, i) => {
          if (s.invest) {
            const name = investigations?.find((x) => x.id === s.invest)?.name ?? '조사';
            const seen = invLog?.[i] ?? [];
            return (
              <div key={i} data-i={i} className={`log-invest${sel === i ? ' is-sel' : ''}`}>
                <button type="button" className="log-invest-head" onClick={() => setSel(sel === i ? null : i)} aria-pressed={sel === i}>
                  조사 · {name.replace(/_/g, ' ')}
                </button>
                {seen.map((x, j) => <p key={j} className="log-line is-sub">{line(x, `${i}-${j}`)}</p>)}
                {sel === i && <button type="button" className="log-jump" onClick={() => onJump(i)}>여기로 이동 ▸</button>}
              </div>
            );
          }
          return (
            <div key={i} data-i={i} className={`log-row${sel === i ? ' is-sel' : ''}${i === current ? ' is-current' : ''}`}>
              <button type="button" className="log-line" onClick={() => setSel(sel === i ? null : i)} aria-pressed={sel === i}>{line(s, String(i))}</button>
              {sel === i && <button type="button" className="log-jump" onClick={() => onJump(i)}>여기로 이동 ▸</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
