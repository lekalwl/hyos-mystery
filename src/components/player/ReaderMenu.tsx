import { useEffect, useRef } from 'react';
import { IconBookmarkAdd, IconBookmarkOpen, IconClose, IconFold, IconLog, IconMemo, IconSound, IconMute } from './icons';

export type ReaderPanel = 'save' | 'load' | 'memo' | 'log' | 'sound' | 'settings';

interface Props {
  open: boolean;
  onToggle: () => void;
  active: ReaderPanel | null;
  onPick: (p: ReaderPanel) => void;
  hasMemo: boolean;
  muted: boolean;
}

const ITEMS: { id: ReaderPanel; label: string; key: string; Icon: () => JSX.Element }[] = [
  { id: 'save', label: '책갈피 끼우기', key: 'B', Icon: IconBookmarkAdd },
  { id: 'load', label: '책갈피 펼치기', key: 'O', Icon: IconBookmarkOpen },
  { id: 'memo', label: '메모', key: 'M', Icon: IconMemo },
  { id: 'log', label: '대사 기록', key: 'L', Icon: IconLog },
];

/**
 * One brass button, folded by default. Opening it drops a column of
 * round icon buttons beneath, each with its label sliding out beside it.
 */
export function ReaderMenu({ open, onToggle, active, onPick, hasMemo, muted }: Props) {
  const items = [...ITEMS, { id: 'settings' as const, label: muted ? '소리 설정 (꺼짐)' : '소리 설정', key: 'V', Icon: muted ? IconMute : IconSound }];
  const ref = useRef<HTMLDivElement>(null);

  // click outside folds the menu
  useEffect(() => {
    if (!open) return;
    const on = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onToggle();
    };
    window.addEventListener('pointerdown', on);
    return () => window.removeEventListener('pointerdown', on);
  }, [open, onToggle]);

  return (
    <div className={`reader-menu${open ? ' is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="rm-main"
        aria-expanded={open}
        aria-controls="reader-menu-items"
        aria-label={open ? '도구 접기' : '도구 펼치기'}
        onClick={onToggle}
      >
        <span className="rm-main-icon">{open ? <IconClose /> : <IconFold />}</span>
      </button>
      <ul id="reader-menu-items" className="rm-items" hidden={!open}>
        {items.map(({ id, label, key, Icon }, i) => (
          <li key={id} style={{ '--i': i } as React.CSSProperties}>
            <button
              type="button"
              className={`rm-item${active === id ? ' is-active' : ''}`}
              onClick={() => onPick(id)}
              aria-keyshortcuts={key}
            >
              <span className="rm-label">{label} <kbd>{key}</kbd></span>
              <span className="rm-icon">
                <Icon />
                {id === 'memo' && hasMemo && <span className="rm-dot" aria-label="메모 있음" />}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
