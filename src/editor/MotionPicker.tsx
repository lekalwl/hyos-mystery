import { useEffect, useState, type CSSProperties } from 'react';
import type { TagDef } from '../engine/vocab';

export interface MotionGroup {
  id: string;
  label: string;
  hint: string;
  /** how the preview applies it */
  mode: 'enter' | 'exit' | 'anim' | 'pose';
  items: TagDef[];
}

/** Modal listing one category of motions, each with a looping preview on the current character. */
export function MotionPicker({ group, sprite, charName, onPick, onClose }: {
  group: MotionGroup;
  sprite: string | null;
  charName?: string;
  onPick: (tag: string) => void;
  onClose: () => void;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 2200);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearInterval(t); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="ed-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ed-modal" role="dialog" aria-modal="true" aria-label={`${group.label} 고르기`}>
        <header className="ed-modal-head">
          <h3>{group.label}</h3>
          <span className="ed-help">{group.hint}{charName ? ` · 미리보기: ${charName}` : ''}</span>
          <button type="button" className="text-btn light" onClick={onClose}>닫기</button>
        </header>
        <ul className="ed-motion-grid">
          {group.items.map((m) => {
            const key = m.key;
            const motion = group.mode === 'enter' ? `in-${key}` : group.mode === 'exit' ? `out-${key}` : '';
            const anim = group.mode === 'anim' ? `anim-${key}` : '';
            const pose = group.mode === 'pose' && key !== 'none' && key !== 'back' ? `pose-${key}` : '';
            return (
              <li key={key}>
                <button type="button" onClick={() => onPick(m.names[0])} title={m.desc}>
                  <span className="ed-motion-stage">
                    {sprite && (
                      <span key={group.mode === 'pose' ? 'p' : tick} className={`vn-char ed-motion-char${key === 'back' ? ' is-flipped' : ''}`} style={{ '--x': '50%', '--xn': 50 } as CSSProperties}>
                        <span className={`vn-char-motion ${motion}`}>
                          <span className={`vn-char-pose ${pose}`}>
                            <span className={`vn-char-anim ${anim}`}>
                              <img className="vn-sprite-img" src={sprite} alt="" draggable={false} />
                            </span>
                          </span>
                        </span>
                      </span>
                    )}
                  </span>
                  <strong>#{m.names[0]}</strong>
                  <small>{m.desc}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
