import { useState } from 'react';
import { BOOKMARK_SLOTS, formatTime, type Bookmark } from '../../lib/storage';
import { IconClose } from './icons';

interface Props {
  mode: 'save' | 'load';
  bookmarks: (Bookmark | null)[];
  currentIndex: number;
  total: number;
  onMode: (m: 'save' | 'load') => void;
  onSave: (slot: number) => void;
  onLoad: (b: Bookmark) => void;
  onDelete: (slot: number) => void;
  onClose: () => void;
}

const RIBBONS = ['#6a2a2f', '#2f4a3a', '#2e3a5a', '#6a5020', '#4a2f4a', '#5a3020'];

export function BookmarkPanel({ mode, bookmarks, currentIndex, total, onMode, onSave, onLoad, onDelete, onClose }: Props) {
  // inline two-step confirm for overwrite / delete (no browser dialogs)
  const [confirm, setConfirm] = useState<{ slot: number; kind: 'overwrite' | 'delete' } | null>(null);

  const pick = (slot: number) => {
    const b = bookmarks[slot];
    if (mode === 'save') {
      if (b && !(confirm?.slot === slot && confirm.kind === 'overwrite')) { setConfirm({ slot, kind: 'overwrite' }); return; }
      setConfirm(null);
      onSave(slot);
    } else if (b) {
      onLoad(b);
    }
  };

  return (
    <div className="reader-modal" role="dialog" aria-modal="true" aria-label={mode === 'save' ? '책갈피 끼우기' : '책갈피 펼치기'} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="bm-panel">
        <header className="bm-head">
          <div className="bm-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'save'} onClick={() => { setConfirm(null); onMode('save'); }}>책갈피 끼우기</button>
            <button type="button" role="tab" aria-selected={mode === 'load'} onClick={() => { setConfirm(null); onMode('load'); }}>책갈피 펼치기</button>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기"><IconClose /></button>
        </header>
        <p className="bm-hint">
          {mode === 'save'
            ? `지금 읽는 자리(${currentIndex + 1} / ${total})를 끼울 칸을 고르세요.`
            : '돌아갈 책갈피를 고르세요.'}
        </p>
        <ol className="bm-slots">
          {Array.from({ length: BOOKMARK_SLOTS }, (_, slot) => {
            const b = bookmarks[slot];
            const asking = confirm?.slot === slot;
            const disabled = mode === 'load' && !b;
            return (
              <li key={slot} className={`bm-slot${b ? ' is-filled' : ''}${asking ? ' is-asking' : ''}`} style={{ '--ribbon': RIBBONS[slot] } as React.CSSProperties}>
                <button type="button" className="bm-card" onClick={() => pick(slot)} disabled={disabled}>
                  <span className="bm-ribbon" aria-hidden="true"><span>{slot + 1}</span></span>
                  {b ? (
                    <>
                      <span className="bm-thumb">{b.background && <img src={b.background} alt="" />}</span>
                      <span className="bm-info">
                        <span className="bm-meta">{formatTime(b.savedAt)} · {b.index + 1}번째 줄</span>
                        <span className="bm-excerpt">
                          {b.speaker && <strong>{b.speaker}</strong>}
                          {b.excerpt}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="bm-empty">{mode === 'save' ? '빈 칸 · 여기에 끼우기' : '비어 있음'}</span>
                  )}
                </button>
                {asking && confirm.kind === 'overwrite' && (
                  <p className="bm-confirm">이 책갈피를 지금 자리로 옮길까요? <button type="button" onClick={() => pick(slot)}>옮기기</button><button type="button" onClick={() => setConfirm(null)}>취소</button></p>
                )}
                {asking && confirm.kind === 'delete' && (
                  <p className="bm-confirm">이 책갈피를 뺄까요? <button type="button" onClick={() => { setConfirm(null); onDelete(slot); }}>빼기</button><button type="button" onClick={() => setConfirm(null)}>취소</button></p>
                )}
                {b && !asking && (
                  <button type="button" className="bm-del" aria-label={`${slot + 1}번 책갈피 빼기`} onClick={() => setConfirm({ slot, kind: 'delete' })}><IconClose /></button>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
