import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { navigate } from '../lib/router';
import { prefersReducedMotion } from '../lib/motion';
import { deleteBookmark, getBookmarks, getMemo, isCompleted, markCompleted, setBookmark, takeStart, type Bookmark } from '../lib/storage';
import { LogView } from '../components/player/LogView';
import { ReaderMenu, type ReaderPanel } from '../components/player/ReaderMenu';
import { BookmarkPanel } from '../components/player/BookmarkPanel';
import { MemoPanel } from '../components/player/MemoPanel';
import { SoundPanel } from '../components/player/SoundPanel';
import { useContent, assetUrl, isOperatorBrowser } from '../content/store';
import { compileScript, type Step } from '../engine/script';
import { Stage } from '../engine/Stage';
import { Hotspots, requiredSpots } from '../engine/Hotspots';
import { audio } from '../engine/audio';
import { markSeen } from '../lib/seen';

const CHAR_MS = 26;

export function PlayerPage({ id }: { id: string }) {
  const { data } = useContent();
  const ep = data.episodes.find((e) => e.id === id);
  const steps = useMemo(
    () => (ep ? compileScript(ep.script, { characters: data.characters, assets: data.assets, startOutfit: ep.startOutfit, investigations: ep.investigations }).steps : []),
    [ep, data.characters, data.assets],
  );

  // investigation progress for the current step
  const [invest, setInvest] = useState<{ index: number; done: string[]; sub: { hid: string; steps: Step[]; i: number } | null }>({ index: -1, done: [], sub: null });
  const [invLog, setInvLog] = useState<Record<number, Step[]>>({});

  const [index, setIndex] = useState(() => takeStart(id));
  const [shown, setShown] = useState(0);
  const [ended, setEnded] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [completed, setCompleted] = useState(() => isCompleted(id));

  const [menuOpen, setMenuOpen] = useState(false);
  const [bmMode, setBmMode] = useState<'save' | 'load' | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [hasMemo, setHasMemo] = useState(() => !!getMemo(id).text.trim());
  const [bookmarks, setBookmarks] = useState(() => getBookmarks(id));
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const muted = useSyncExternalStore((l) => audio.subscribe(l), () => audio.prefs.muted);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);
  const modalOpen = logOpen || bmMode !== null;

  const safeIndex = Math.min(index, Math.max(0, steps.length - 1));
  const baseStep: Step | undefined = steps[safeIndex];
  const invDef = baseStep?.invest ? ep?.investigations?.find((i) => i.id === baseStep.invest) : undefined;
  const invState = invest.index === safeIndex ? invest : { index: safeIndex, done: [] as string[], sub: null };
  const sub = invDef ? invState.sub : null;
  // Coming back to the investigation screen after looking at a spot: show it
  // as it ended up, not as it arrived — characters that left stay gone, and
  // entrances, exits, screen effects and sounds don't play a second time.
  const settledBase = useMemo<Step | undefined>(() => baseStep && {
    ...baseStep,
    chars: baseStep.chars.filter((c) => !c.exit).map((c) => ({ ...c, enter: undefined, anim: undefined })),
    fx: [], se: [], bgTransition: 'cut', cgTransition: 'cut',
  }, [baseStep]);
  const returned = !!invDef && !sub && invState.done.length > 0;
  const step: Step | undefined = sub ? sub.steps[sub.i] : returned ? settledBase : baseStep;
  const stepKey = `${safeIndex}:${sub?.hid ?? ''}:${sub?.i ?? ''}`;
  const doneSet = new Set(invState.done);
  const invRequired = invDef ? requiredSpots(invDef) : [];
  const invComplete = !!invDef && invRequired.every((h) => doneSet.has(h.id));
  const full = step?.text.length ?? 0;
  const typing = shown < full;

  // typewriter
  useEffect(() => {
    if (!step) return;
    if (prefersReducedMotion() || step.narr === 'emphasis') { setShown(full); return; }
    setShown(0);
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      setShown((prev) => (prev >= full ? prev : n));
      if (n >= full) window.clearInterval(t);
    }, CHAR_MS);
    return () => window.clearInterval(t);
  }, [stepKey, step, full]);

  // warm the cache with the next few scenes' images so swaps are instant
  useEffect(() => {
    for (const s of steps.slice(safeIndex + 1, safeIndex + 4)) {
      for (const id of [s.bg, s.cg, s.item, ...s.chars.map((c) => c.sprite)]) {
        const u = assetUrl(id);
        if (u) { const img = new Image(); img.src = u; }
      }
    }
  }, [safeIndex, steps]);

  // remember what the reader has seen (gallery / profile spoiler guard)
  useEffect(() => {
    if (!step) return;
    // a character counts as "met" once they speak under their real name
    const sp = step.speaker;
    const named = sp?.charId && data.characters.find((c) => c.id === sp.charId)?.name === sp.name ? `char:${sp.charId}` : null;
    markSeen([step.bg, step.cg, step.item, ...step.chars.filter((c) => !c.exit).map((c) => c.sprite), named]);
  }, [step, data.characters]);

  // sound for this step
  useEffect(() => {
    if (!step) return;
    audio.playBgm(assetUrl(step.bgm));
    step.se.forEach((s) => audio.playSe(assetUrl(s)));
  }, [step]);
  useEffect(() => () => audio.stopAll(), []);

  const next = useCallback(() => {
    if (safeIndex < steps.length - 1) setIndex(safeIndex + 1);
    else { setEnded(true); markCompleted(id); setCompleted(true); }
  }, [safeIndex, steps.length, id]);

  const advance = useCallback(() => {
    if (modalOpen || ended) return;
    if (typing) { setShown(full); return; }
    if (invDef) {
      if (!sub) { if (invComplete) next(); return; }
      if (sub.i < sub.steps.length - 1) { setInvest({ ...invState, sub: { ...sub, i: sub.i + 1 } }); return; }
      // finished looking at one spot
      const done = invState.done.includes(sub.hid) ? invState.done : [...invState.done, sub.hid];
      setInvest({ index: safeIndex, done, sub: null });
      if (invRequired.every((h) => done.includes(h.id))) next();
      return;
    }
    next();
  }, [modalOpen, ended, typing, full, invDef, sub, invState, invComplete, invRequired, safeIndex, next]);

  const examine = (hid: string) => {
    if (!invDef || !baseStep || !ep || sub || modalOpen) return;
    const h = invDef.hotspots.find((x) => x.id === hid);
    if (!h) return;
    const subSteps = compileScript(h.script, { characters: data.characters, assets: data.assets, startOutfit: ep.startOutfit, from: baseStep }).steps;
    if (!subSteps.length) {
      const done = invState.done.includes(hid) ? invState.done : [...invState.done, hid];
      setInvest({ index: safeIndex, done, sub: null });
      if (invRequired.every((x) => done.includes(x.id))) next();
      return;
    }
    setInvLog((m) => ({ ...m, [safeIndex]: [...(m[safeIndex] ?? []), ...subSteps] }));
    setInvest({ ...invState, sub: { hid, steps: subSteps, i: 0 } });
  };

  const toList = () => navigate('episodes');

  const pickTool = useCallback((p: ReaderPanel) => {
    setMenuOpen(false);
    if (p === 'log') setLogOpen(true);
    else if (p === 'memo') setMemoOpen((v) => !v);
    else if (p === 'sound') audio.setMuted(!audio.prefs.muted);
    else if (p === 'settings') setSoundOpen((v) => !v);
    else { setBookmarks(getBookmarks(id)); setBmMode(p); }
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('textarea, input')) { if (e.key === 'Escape') setMemoOpen(false); return; }
      if (t.closest('button') && (e.key === 'Enter' || e.key === ' ')) return;
      if (e.key === 'Escape') {
        if (soundOpen) setSoundOpen(false);
        else if (bmMode) setBmMode(null);
        else if (logOpen) setLogOpen(false);
        else if (menuOpen) setMenuOpen(false);
        else if (memoOpen) setMemoOpen(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'l') { setLogOpen((v) => !v); return; }
      if (k === 'm') { e.preventDefault(); pickTool('memo'); return; }
      if (k === 'b') { pickTool('save'); return; }
      if (k === 'o') { pickTool('load'); return; }
      if (k === 's') { pickTool('sound'); return; }
      if (k === 'v') { pickTool('settings'); return; }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, logOpen, bmMode, menuOpen, memoOpen, soundOpen, pickTool]);

  if (!ep || (ep.status !== 'available' && !isOperatorBrowser()) || !step) {
    return (
      <div className="player player-missing">
        <p>이 에피소드는 아직 열람할 수 없습니다.</p>
        <button type="button" className="seal-btn" onClick={toList}>목록으로</button>
      </div>
    );
  }

  const sp = step.speaker;

  const saveTo = (slot: number) => {
    const b: Bookmark = {
      slot,
      index: safeIndex,
      savedAt: Date.now(),
      speaker: sp?.name ?? null,
      excerpt: step.text.length > 70 ? `${step.text.slice(0, 70)}…` : step.text,
      background: assetUrl(step.cg ?? step.bg) ?? undefined,
    };
    const ok = setBookmark(id, b);
    setBookmarks(getBookmarks(id));
    setBmMode(null);
    showToast(ok ? `${slot + 1}번 책갈피를 끼웠습니다` : '브라우저 저장소를 쓸 수 없어 저장하지 못했습니다');
  };
  const loadFrom = (b: Bookmark) => {
    setEnded(false);
    setIndex(Math.min(b.index, steps.length - 1));
    setInvest({ index: -1, done: [], sub: null });
    setBmMode(null);
    showToast(`${b.slot + 1}번 책갈피를 펼쳤습니다`);
  };

  const box = ended ? null : invDef && !sub ? (
    <p className="vn-invest-prompt" aria-live="polite">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M14.5 14.5 L20 20" stroke="currentColor" strokeWidth="2" /></svg>
      {step.text}
    </p>
  ) : !ended ? (
    <button type="button" className="vn-box" onClick={(e) => { e.stopPropagation(); advance(); }} aria-label="다음 대사">
      {sp && <span className="vn-name" style={sp.color ? { color: sp.color } : undefined}>{sp.name}</span>}
      <span className={`vn-text${sp ? '' : ' is-narration'}${step.thought ? ' is-thought' : ''}`} aria-live="polite">
        {step.text.slice(0, shown)}
        <span className="vn-ghost" aria-hidden="true">{step.text.slice(shown)}</span>
      </span>
      <span className="vn-meta">
        <span>{safeIndex + 1} / {steps.length}</span>
        {!typing && !(invDef && !sub) && <span className="vn-next" aria-hidden="true">▾</span>}
      </span>
    </button>
  ) : null;

  return (
    <div className={`player${memoOpen ? ' has-memo' : ''}`}>
      <div className="vn-stage" onWheel={(e) => { if (e.deltaY < 0 && !modalOpen) setLogOpen(true); }}>
        <Stage
          step={step}
          stepKey={stepKey}
          visibleText={step.text.slice(0, shown)}
          hiddenText={step.text.slice(shown)}
          box={box}
          overlay={invDef && !sub && !ended ? <Hotspots inv={invDef} done={doneSet} onPick={examine} /> : undefined}
          onClick={() => { if (step.narr && step.narr !== 'box') advance(); }}
        />

        {invDef && !ended && (
          <p className="vn-invest-bar" role="status">
            <span>조사</span>
            <strong>{invRequired.filter((h) => doneSet.has(h.id)).length} / {invRequired.length}</strong>
            {invComplete && !sub && <button type="button" className="text-btn" onClick={next}>다음으로 ▸</button>}
          </p>
        )}

        <header className="vn-top">
          <button type="button" className="vn-btn" onClick={toList}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            목록
          </button>
          <p className="vn-ep">
            <span>Episode {ep.number}</span> {ep.title}
            {ep.test && <em className="test-badge">TEST</em>}
          </p>
          <span className="vn-top-spacer" aria-hidden="true" />
        </header>
      </div>

      {!logOpen && (
        <ReaderMenu
          open={menuOpen}
          onToggle={() => setMenuOpen((v) => !v)}
          active={bmMode ?? (memoOpen ? 'memo' : soundOpen ? 'settings' : null)}
          onPick={pickTool}
          hasMemo={hasMemo}
          muted={muted}
        />
      )}

      {memoOpen && (
        <MemoPanel
          episodeId={id}
          episodeLabel={`Episode ${ep.number} · ${ep.title}`}
          onClose={() => setMemoOpen(false)}
          onChange={setHasMemo}
          onToast={showToast}
        />
      )}

      {bmMode && (
        <BookmarkPanel
          mode={bmMode}
          bookmarks={bookmarks}
          currentIndex={safeIndex}
          total={steps.length}
          onMode={setBmMode}
          onSave={saveTo}
          onLoad={loadFrom}
          onDelete={(slot) => { deleteBookmark(id, slot); setBookmarks(getBookmarks(id)); }}
          onClose={() => setBmMode(null)}
        />
      )}

      {soundOpen && <SoundPanel onClose={() => setSoundOpen(false)} />}

      {toast && <p className="reader-toast" role="status">{toast}</p>}

      {ended && (
        <div className="vn-end" role="dialog" aria-label="에피소드 종료">
          <p className="ep-number">Episode {ep.number}</p>
          <h2>에피소드 종료</h2>
          <span className="ornament-rule" aria-hidden="true" />
          <div className="vn-end-actions">
            <button type="button" className="seal-btn" onClick={() => { setIndex(0); setEnded(false); }}>처음부터</button>
            <button type="button" className="seal-btn" onClick={toList} autoFocus>목록으로</button>
          </div>
        </div>
      )}

      {logOpen && (
        <LogView
          steps={steps}
          upTo={completed ? steps.length - 1 : safeIndex}
          current={safeIndex}
          invLog={invLog}
          investigations={ep.investigations}
          onClose={() => setLogOpen(false)}
          onJump={(i) => { setIndex(i); setInvest({ index: -1, done: [], sub: null }); setEnded(false); setLogOpen(false); showToast('그 장면부터 이어 읽습니다'); }}
        />
      )}
    </div>
  );
}
