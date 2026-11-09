import { useMemo, useRef, useState } from 'react';
import type { ContentData, EpisodeDef } from '../content/types';
import { updateContent } from '../content/store';
import { compileScript, stepAtLine } from '../engine/script';
import { COMMON_EXPRESSIONS, NARR_STYLES, POSITIONS, SCREEN_FX, SPRITE_ANIMS, LINE_MODS, BG_TRANSITIONS } from '../engine/vocab';
import { requestStart } from '../lib/storage';
import { navigate } from '../lib/router';
import { Preview } from './Preview';
import { outfitsOf } from '../content/sprites';

/** Insert text keeping the browser's undo history where possible. */
function insertText(el: HTMLTextAreaElement, start: number, end: number, text: string) {
  el.focus();
  el.setSelectionRange(start, end);
  const ok = document.execCommand?.('insertText', false, text);
  if (!ok) el.setRangeText(text, start, end, 'end');
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export function ScriptTab({ ep, data }: { ep: EpisodeDef; data: ContentData }) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [cursorLine, setCursorLine] = useState(0);
  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const [openGroup, setOpenGroup] = useState<string>('char');

  const { steps, diagnostics } = useMemo(
    () => compileScript(ep.script, { characters: data.characters, assets: data.assets, startOutfit: ep.startOutfit }),
    [ep.script, data.characters, data.assets],
  );
  const lines = ep.script.split('\n');
  const stepIndex = stepOverride ?? stepAtLine(steps, cursorLine);
  const diagByLine = useMemo(() => {
    const m = new Map<number, 'error' | 'warn'>();
    for (const d of diagnostics) if (m.get(d.line) !== 'error') m.set(d.line, d.level);
    return m;
  }, [diagnostics]);

  const setScript = (script: string) =>
    updateContent((d) => ({ ...d, episodes: d.episodes.map((e) => (e.id === ep.id ? { ...e, script } : e)) }));

  const syncCursor = () => {
    const el = areaRef.current;
    if (!el) return;
    setCursorLine(el.value.slice(0, el.selectionStart).split('\n').length - 1);
    setStepOverride(null);
  };

  const lineBounds = () => {
    const el = areaRef.current!;
    const v = el.value;
    const s = v.lastIndexOf('\n', el.selectionStart - 1) + 1;
    let e = v.indexOf('\n', el.selectionStart);
    if (e < 0) e = v.length;
    return { s, e, text: v.slice(s, e) };
  };

  /** (#tag) goes to the front of the current line, after any tag groups already there. */
  const addTag = (tag: string) => {
    const el = areaRef.current; if (!el) return;
    const { s, text } = lineBounds();
    if (text.trim().startsWith('@')) {
      insertText(el, s + text.length, s + text.length, ` #${tag}`);
    } else {
      const lead = text.match(/^\s*(\([^)]*\)\s*)*/)?.[0] ?? '';
      insertText(el, s + lead.length, s + lead.length, `(#${tag}) `);
    }
    syncCursor();
  };
  /** Directive goes on its own line above the current one. */
  const addDirective = (line: string) => {
    const el = areaRef.current; if (!el) return;
    const { s, text } = lineBounds();
    insertText(el, s, s, text.trim() ? `${line}\n` : line);
    syncCursor();
  };
  const addSpeaker = (name: string) => {
    const el = areaRef.current; if (!el) return;
    const { s, e, text } = lineBounds();
    if (!text.trim()) insertText(el, s, e, `${name}: `);
    else insertText(el, e, e, `\n${name}: `);
    syncCursor();
  };

  const jumpTo = (line: number) => {
    const el = areaRef.current; if (!el) return;
    const pos = lines.slice(0, line).reduce((n, l) => n + l.length + 1, 0);
    el.focus();
    el.setSelectionRange(pos, pos);
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
    el.scrollTop = Math.max(0, line * lh - el.clientHeight / 3);
    syncCursor();
  };

  // character of the current line → its expressions in the palette
  const step = steps[stepIndex];
  const currentChar = data.characters.find((c) => c.id === step?.speaker?.charId) ?? data.characters[0];
  const exprs = Array.from(new Set([
    ...data.assets.filter((a) => a.kind === 'sprite' && a.character === currentChar?.id).map((a) => a.expression!),
    ...COMMON_EXPRESSIONS,
  ]));
  const own = new Set(data.assets.filter((a) => a.kind === 'sprite' && a.character === currentChar?.id).map((a) => a.expression));
  const assetsOf = (k: string) => data.assets.filter((a) => a.kind === k);

  const groups: { id: string; label: string; body: JSX.Element }[] = [
    { id: 'char', label: '인물', body: <>{data.characters.map((c) => <button key={c.id} type="button" className="chip" onClick={() => addSpeaker(c.name)} style={{ borderColor: c.color }}>{c.name}</button>)}</> },
    {
      id: 'expr', label: `표정 · ${currentChar?.name ?? ''}`,
      body: <>
        {currentChar && outfitsOf(currentChar, data.assets).length > 1 && <>
          <span className="chip-label">의상</span>
          {outfitsOf(currentChar, data.assets).map((o) => <button key={o} type="button" className="chip kind-outfit" onClick={() => addTag(o)}>{o}</button>)}
          <span className="chip-label">표정</span>
        </>}
        {exprs.map((x) => <button key={x} type="button" className={`chip${own.has(x) ? ' has-art' : ''}`} onClick={() => addTag(x)} title={own.has(x) ? '스프라이트 있음' : '스프라이트 없음 (임시 이미지)'}>{x}</button>)}
      </>,
    },
    { id: 'anim', label: '동작', body: <>{SPRITE_ANIMS.map((a) => <button key={a.key} type="button" className={`chip kind-${a.kind}`} onClick={() => addTag(a.names[0])} title={a.desc}>{a.names[0]}</button>)}</> },
    { id: 'pos', label: '위치', body: <>{POSITIONS.map((p) => <button key={p.key} type="button" className="chip" onClick={() => addTag(p.names[0])}>{p.names[0]}</button>)}</> },
    {
      id: 'narr', label: '해설 · 연출',
      body: <>
        {NARR_STYLES.filter((n) => n.key !== 'box').map((n) => <button key={n.key} type="button" className="chip" onClick={() => addTag(n.names[0])} title={n.desc}>{n.names[0]}</button>)}
        {LINE_MODS.map((n) => <button key={n.key} type="button" className="chip" onClick={() => addTag(n.names[0])} title={n.desc}>{n.names[0]}</button>)}
        {SCREEN_FX.map((n) => <button key={n.key} type="button" className="chip kind-fx" onClick={() => addTag(n.names[0])} title={n.desc}>{n.names[0]}</button>)}
      </>,
    },
    {
      id: 'stage', label: '무대 명령',
      body: <>
        <span className="chip-label">배경</span>{assetsOf('bg').map((a) => <button key={a.id} type="button" className="chip" onClick={() => addDirective(`@배경 ${a.name}`)}>{a.name}</button>)}
        {BG_TRANSITIONS.slice(1).map((t) => <button key={t.key} type="button" className="chip ghost" onClick={() => addTag(t.names[0])} title={t.desc}>#{t.names[0]}</button>)}
        <span className="chip-label">삽화</span>{assetsOf('cg').map((a) => <button key={a.id} type="button" className="chip" onClick={() => addDirective(`@삽화 ${a.name}`)}>{a.name}</button>)}
        <button type="button" className="chip ghost" onClick={() => addDirective('@삽화 끝')}>삽화 끝</button>
        <span className="chip-label">아이템</span>{assetsOf('item').map((a) => <button key={a.id} type="button" className="chip" onClick={() => addDirective(`@아이템 ${a.name}`)}>{a.name}</button>)}
        <button type="button" className="chip ghost" onClick={() => addDirective('@아이템 끝')}>아이템 끝</button>
        <span className="chip-label">음악</span>{assetsOf('bgm').map((a) => <button key={a.id} type="button" className="chip" onClick={() => addDirective(`@음악 ${a.name}`)}>{a.name}</button>)}
        <button type="button" className="chip ghost" onClick={() => addDirective('@음악 끝')}>음악 끝</button>
        <span className="chip-label">효과음</span>{assetsOf('se').map((a) => <button key={a.id} type="button" className="chip" onClick={() => addDirective(`@효과음 ${a.name}`)}>{a.name}</button>)}
        <span className="chip-label">인물</span>
        {currentChar && <>
          <button type="button" className="chip ghost" onClick={() => addDirective(`@등장 ${currentChar.name}`)}>@등장 {currentChar.name}</button>
          <button type="button" className="chip ghost" onClick={() => addDirective(`@동작 ${currentChar.name}`)}>@동작 {currentChar.name}</button>
          <button type="button" className="chip ghost" onClick={() => addDirective(`@퇴장 ${currentChar.name}`)}>@퇴장 {currentChar.name}</button>
        </>}
        <button type="button" className="chip ghost" onClick={() => addDirective('@모두퇴장')}>@모두퇴장</button>
        {Array.from(new Set(data.characters.flatMap((c) => outfitsOf(c, data.assets)))).filter((o) => o !== '기본').map((o) => (
          <button key={o} type="button" className="chip ghost" onClick={() => addDirective(`@의상 모두 ${o}`)}>@의상 모두 {o}</button>
        ))}
      </>,
    },
  ];

  const errors = diagnostics.filter((d) => d.level === 'error').length;

  return (
    <div className="ed-script">
      <div className="ed-script-left">
        <div className="ed-palette">
          <div className="ed-palette-tabs" role="tablist">
            {groups.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={openGroup === g.id} onClick={() => setOpenGroup(g.id)}>{g.label}</button>
            ))}
          </div>
          <div className="ed-palette-body">{groups.find((g) => g.id === openGroup)?.body}</div>
          <p className="ed-palette-hint">태그는 커서가 있는 줄 앞에, 무대 명령은 그 줄 위에 들어갑니다.</p>
        </div>

        <div className="ed-code">
          <div className="ed-gutter" ref={gutterRef} aria-hidden="true">
            {lines.map((_, i) => (
              <div key={i} className={`g-line${i === cursorLine ? ' is-cur' : ''}${diagByLine.has(i) ? ` has-${diagByLine.get(i)}` : ''}`}>{i + 1}</div>
            ))}
          </div>
          <label htmlFor="ed-script-area" className="sr-only">대본</label>
          <textarea
            id="ed-script-area"
            ref={areaRef}
            value={ep.script}
            spellCheck={false}
            onChange={(e) => setScript(e.target.value)}
            onSelect={syncCursor}
            onKeyUp={syncCursor}
            onClick={syncCursor}
            onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
            placeholder={'@배경 서재\n(#기쁨)(#통통) 인물 A: 대사\n(#칸) 해설'}
          />
        </div>

        <div className={`ed-diag${errors ? ' has-errors' : ''}`}>
          <p className="ed-diag-head">
            {diagnostics.length === 0 ? '문제 없음' : `확인할 것 ${diagnostics.length}개`}
            <span> · 장면 {steps.length}개</span>
          </p>
          {diagnostics.length > 0 && (
            <ul>
              {diagnostics.slice(0, 60).map((d, i) => (
                <li key={i}>
                  <button type="button" onClick={() => jumpTo(d.line)} className={`diag-${d.level}`}>
                    <span>{d.line + 1}줄</span>{d.msg}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Preview
        step={steps[stepIndex]}
        index={stepIndex}
        total={steps.length}
        onIndex={(i) => { setStepOverride(i); if (steps[i]) jumpTo(steps[i].line); setStepOverride(i); }}
        onPlay={() => { requestStart(ep.id, stepIndex); navigate(`episode-${ep.id}`); }}
        sound={sound}
        onSound={setSound}
      />
    </div>
  );
}
