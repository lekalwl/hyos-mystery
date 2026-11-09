import { useEffect, useRef, useState } from 'react';
import { formatTime, getMemo, setMemo } from '../../lib/storage';
import { renderMemoPng } from '../../lib/memoImage';
import { IconClose } from './icons';
import { saveFile } from '../../lib/download';

interface Props {
  episodeId: string;
  episodeLabel: string;
  onClose: () => void;
  onChange: (hasText: boolean) => void;
  onToast: (msg: string) => void;
}

/**
 * Case notebook docked beside the stage. Reading continues while it is
 * open; text is saved per episode as you type.
 */
export function MemoPanel({ episodeId, episodeLabel, onClose, onChange, onToast }: Props) {
  const initial = useRef(getMemo(episodeId));
  const [text, setText] = useState(initial.current.text);
  const [savedAt, setSavedAt] = useState(initial.current.updatedAt);
  const [status, setStatus] = useState<'saved' | 'saving' | 'failed'>('saved');
  const [confirmClear, setConfirmClear] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { areaRef.current?.focus(); }, []);

  // debounced autosave
  useEffect(() => {
    if (text === initial.current.text && savedAt === initial.current.updatedAt) return;
    setStatus('saving');
    const t = window.setTimeout(() => {
      const ok = setMemo(episodeId, text);
      setStatus(ok ? 'saved' : 'failed');
      if (ok) setSavedAt(Date.now());
      onChange(!!text.trim());
    }, 400);
    return () => window.clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportPng = async () => {
    if (!text.trim()) { onToast('메모가 비어 있습니다.'); return; }
    const url = await renderMemoPng({ episodeLabel, text, savedAt: savedAt || Date.now() });
    const blob = await (await fetch(url)).blob();
    const r = await saveFile(blob, `grayhaven-memo-${episodeId}.png`);
    if (r === 'saved') onToast('메모 이미지를 저장했습니다');
    else if (r === 'declined') onToast('저장을 취소했습니다');
    else setPreview(url); // can't save here: show it so it can be saved by hand
  };

  return (
    <aside className="memo-panel" aria-label="추리 메모">
      <header className="memo-head">
        <div>
          <p className="memo-kicker">Case Notes</p>
          <h2>추리 메모</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="메모 닫기"><IconClose /></button>
      </header>
      <p className="memo-ep">{episodeLabel}</p>

      <label htmlFor={`memo-${episodeId}`} className="sr-only">메모 내용</label>
      <textarea
        id={`memo-${episodeId}`}
        ref={areaRef}
        className="memo-area"
        value={text}
        placeholder="떠오른 단서, 의심 가는 점, 시간 순서…"
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />

      <footer className="memo-foot">
        <span className={`memo-status is-${status}`} aria-live="polite">
          {status === 'saving' && '기록 중…'}
          {status === 'saved' && (savedAt ? `저장됨 · ${formatTime(savedAt)}` : '에피소드별로 자동 저장됩니다')}
          {status === 'failed' && '브라우저 저장소를 쓸 수 없어 저장되지 않았습니다'}
        </span>
        <div className="memo-actions">
          {confirmClear ? (
            <>
              <span className="memo-ask">모두 지울까요?</span>
              <button type="button" className="text-btn danger" onClick={() => { setText(''); setConfirmClear(false); }}>지우기</button>
              <button type="button" className="text-btn" onClick={() => setConfirmClear(false)}>취소</button>
            </>
          ) : (
            <>
              <button type="button" className="text-btn" onClick={() => setConfirmClear(true)} disabled={!text}>지우기</button>
              <button type="button" className="seal-btn small" onClick={exportPng}>PNG로 저장</button>
            </>
          )}
        </div>
      </footer>

      {preview && (
        <div className="reader-modal" role="dialog" aria-modal="true" aria-label="메모 이미지" onClick={(e) => e.target === e.currentTarget && setPreview(null)}>
          <div className="memo-preview">
            <img src={preview} alt="메모 이미지 미리보기" />
            <p>다운로드가 시작되지 않았다면 이미지를 길게 누르거나 우클릭해서 저장하세요.</p>
            <button type="button" className="seal-btn small" onClick={() => setPreview(null)}>닫기</button>
          </div>
        </div>
      )}
    </aside>
  );
}
