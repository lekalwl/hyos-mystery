import { useMemo, useRef, useState } from 'react';
import type { ContentData, EpisodeDef } from '../content/types';
import { updateContent } from '../content/store';
import { compileScript, stepAtLine } from '../engine/script';
import { COMMON_EXPRESSIONS, NARR_STYLES, POSITIONS, SCREEN_FX, SPRITE_ANIMS, LINE_MODS, BG_TRANSITIONS, POSES, CAMERA_SPEEDS, LAYERS } from '../engine/vocab';
import type { AssetKind } from '../content/types';
import { AssetPicker } from './AssetPicker';
import { CameraPicker } from './CameraPicker';
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
  const [picker, setPicker] = useState<AssetKind | null>(null);
  const [bgTr, setBgTr] = useState('fade');
  const [camOpen, setCamOpen] = useState(false);

  const { steps, diagnostics } = useMemo(
    () => compileScript(ep.script, { characters: data.characters, assets: data.assets, startOutfit: ep.startOutfit, investigations: ep.investigations }),
    [ep.script, data.characters, data.assets, ep.investigations],
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
  const count = (k: string) => data.assets.filter((a) => a.kind === k).length;
  const DIR_WORD: Partial<Record<AssetKind, string>> = { bg: '배경', cg: '삽화', item: '아이템', bgm: '음악', se: '효과음' };
  const pickBtn = (k: AssetKind, label: string) => (
    <button type="button" className="chip pick" onClick={() => setPicker(k)}>{label} 고르기… <small>{count(k)}</small></button>
  );

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
    {
      id: 'anim', label: '동작',
      body: <>
        <span className="chip-label">등장·퇴장</span>
        {SPRITE_ANIMS.filter((a) => a.kind === 'enter' || a.kind === 'exit').map((a) => <button key={a.key} type="button" className={`chip kind-${a.kind}`} onClick={() => addTag(a.names[0])} title={a.desc}>{a.names[0]}</button>)}
        <span className="chip-label">한 번</span>
        {SPRITE_ANIMS.filter((a) => a.kind === 'once').map((a) => <button key={a.key} type="button" className="chip" onClick={() => addTag(a.names[0])} title={a.desc}>{a.names[0]}</button>)}
        <span className="chip-label">휙 지나가기 (그 줄 뒤 사라짐)</span>
        {SPRITE_ANIMS.filter((a) => a.kind === 'pass').map((a) => <button key={a.key} type="button" className="chip kind-enter" onClick={() => addTag(a.names[0])} title={a.desc}>{a.names[0]}</button>)}
        <span className="chip-label">대사 동안 반복</span>
        {SPRITE_ANIMS.filter((a) => a.kind === 'loop').map((a) => <button key={a.key} type="button" className="chip kind-loop" onClick={() => addTag(a.names[0])} title={a.desc}>{a.names[0]}</button>)}
        <span className="chip-label">자세 (풀 때까지 유지)</span>
        {POSES.map((a) => <button key={a.key} type="button" className={`chip kind-pose${a.key === 'none' ? ' ghost' : ''}`} onClick={() => addTag(a.names[0])} title={a.desc}>{a.names[0]}</button>)}
      </>,
    },
    {
      id: 'camera', label: '카메라',
      body: <>
        <button type="button" className="chip pick" onClick={() => setCamOpen(true)}>화면에서 위치 고르기…</button>
        <button type="button" className="chip ghost" onClick={() => addDirective('@카메라 전체')}>@카메라 전체</button>
        {step?.chars.filter((c) => !c.exit).map((c) => {
          const n = data.characters.find((x) => x.id === c.id)?.name ?? c.id;
          return <button key={c.id} type="button" className="chip ghost" onClick={() => addDirective(`@카메라 ${n}`)} title="그 인물 얼굴 쪽으로 확대">@카메라 {n}</button>;
        })}
        {POSITIONS.map((p) => <button key={p.key} type="button" className="chip ghost" onClick={() => addDirective(`@카메라 ${p.names[0]}`)}>@카메라 {p.names[0]}</button>)}
        <span className="chip-label">속도 (@카메라 줄 뒤에)</span>
        {CAMERA_SPEEDS.slice(1).map((c) => <button key={c.key} type="button" className="chip ghost" onClick={() => addTag(c.names[0])} title={c.desc}>#{c.names[0]}</button>)}
      </>,
    },
    {
      id: 'pos', label: '위치 · 앞뒤',
      body: <>
        {POSITIONS.map((p) => <button key={p.key} type="button" className="chip" onClick={() => addTag(p.names[0])}>{p.names[0]}</button>)}
        <span className="chip-label">겹칠 때 (유지)</span>
        {LAYERS.map((l) => <button key={l.key} type="button" className="chip kind-pose" onClick={() => addTag(l.names[0])} title={l.desc}>{l.names[0]}</button>)}
      </>,
    },
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
        {pickBtn('bg', '배경')}
        {pickBtn('cg', '삽화')}<button type="button" className="chip ghost" onClick={() => addDirective('@삽화 끝')}>삽화 끝</button>
        {pickBtn('item', '아이템')}<button type="button" className="chip ghost" onClick={() => addDirective('@아이템 끝')}>아이템 끝</button>
        {pickBtn('bgm', '음악')}<button type="button" className="chip ghost" onClick={() => addDirective('@음악 끝')}>음악 끝</button>
        {pickBtn('se', '효과음')}
        <br />
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
    {
      id: 'invest', label: '조사',
      body: <>
        {(ep.investigations ?? []).map((i) => <button key={i.id} type="button" className="chip pick" onClick={() => addDirective(`@조사 ${i.name}`)} title={`조사할 곳 ${i.hotspots.length}개`}>@조사 {i.name}</button>)}
        {!(ep.investigations ?? []).length && <span className="chip-label">조사 탭에서 조사 장면을 먼저 만드세요. 만든 조사는 여기서 대본에 넣을 수 있습니다.</span>}
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

      {picker && (
        <AssetPicker
          kind={picker}
          data={data}
          current={picker === 'bg' ? step?.bg ?? undefined : picker === 'bgm' ? step?.bgm ?? undefined : undefined}
          onClose={() => setPicker(null)}
          onPick={(a) => {
            const tr = picker === 'bg' && bgTr !== 'fade' ? ` #${BG_TRANSITIONS.find((t) => t.key === bgTr)!.names[0]}` : '';
            addDirective(`@${DIR_WORD[picker]} ${a.name}${tr}`);
            setPicker(null);
          }}
          footer={picker === 'bg' ? (
            <div className="ed-row" role="radiogroup" aria-label="전환 방식">
              <span className="chip-label">바뀌는 방식</span>
              {BG_TRANSITIONS.map((t) => (
                <label key={t.key} className="ed-check" title={t.desc}>
                  <input type="radio" name="bg-tr" checked={bgTr === t.key} onChange={() => setBgTr(t.key)} /> {t.names[0]}
                </label>
              ))}
            </div>
          ) : undefined}
        />
      )}
      {camOpen && <CameraPicker step={step} onInsert={addDirective} onClose={() => setCamOpen(false)} />}

      <Preview
        investigations={ep.investigations}
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
