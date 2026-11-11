import { useMemo, useRef, useState } from 'react';
import type { ContentData, EpisodeDef, Hotspot, InvestigationDef } from '../content/types';
import { assetUrl, newId, updateContent } from '../content/store';
import { CAMERA_HOME, compileScript, type Step } from '../engine/script';
import { AssetPicker } from './AssetPicker';
import { Preview } from './Preview';

/**
 * Investigation scenes: a background with clickable evidence spots.
 * Each spot has its own short dialogue; once every required spot has been
 * examined, the story continues after the `@조사 이름` line.
 */
export function InvestigationTab({ ep, data }: { ep: EpisodeDef; data: ContentData }) {
  const list = ep.investigations ?? [];
  const [selId, setSelId] = useState(list[0]?.id ?? '');
  const inv = list.find((i) => i.id === selId) ?? list[0];

  const patchEp = (fn: (e: EpisodeDef) => EpisodeDef) =>
    updateContent((d) => ({ ...d, episodes: d.episodes.map((e) => (e.id === ep.id ? fn(e) : e)) }));
  const patchInv = (id: string, fn: (i: InvestigationDef) => InvestigationDef) =>
    patchEp((e) => ({ ...e, investigations: (e.investigations ?? []).map((i) => (i.id === id ? fn(i) : i)) }));

  const add = () => {
    let n = list.length + 1;
    while (list.some((i) => i.name === `조사${n}`)) n++;
    const created: InvestigationDef = { id: newId('inv'), name: `조사${n}`, hotspots: [], prompt: '' };
    patchEp((e) => ({ ...e, investigations: [...(e.investigations ?? []), created] }));
    setSelId(created.id);
  };

  return (
    <div className="ed-invest">
      <aside className="ed-invest-list">
        <h3>조사 장면</h3>
        <p className="ed-help">대본에 <code>@조사 이름</code>을 쓰면 그 자리에서 조사가 시작됩니다. 필수 증거를 모두 살펴보면 다음 줄로 넘어갑니다.</p>
        <ul>
          {list.map((i) => (
            <li key={i.id}>
              <button type="button" className={i.id === inv?.id ? 'is-current' : undefined} onClick={() => setSelId(i.id)}>
                {i.name} <small>증거 {i.hotspots.length}</small>
                {!new RegExp(`^\\s*@(조사|investigate)\\s+${escapeRe(i.name)}\\s*$`, 'm').test(ep.script) && <em>대본에 없음</em>}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="seal-btn small" onClick={add}>+ 새 조사</button>
      </aside>
      {inv ? <InvestEditor key={inv.id} ep={ep} data={data} inv={inv} patch={(fn) => patchInv(inv.id, fn)} onDelete={() => {
        patchEp((e) => ({ ...e, investigations: (e.investigations ?? []).filter((x) => x.id !== inv.id) }));
        setSelId('');
      }} onRename={(name) => {
        const re = new RegExp(`^(\\s*@(?:조사|investigate)\\s+)${escapeRe(inv.name)}(\\s*)$`, 'gm');
        patchEp((e) => ({
          ...e,
          script: e.script.replace(re, `$1${name}$2`),
          investigations: (e.investigations ?? []).map((x) => (x.id === inv.id ? { ...x, name } : x)),
        }));
      }} /> : <p className="ed-empty">「+ 새 조사」로 조사 장면을 만드세요.</p>}
    </div>
  );
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function InvestEditor({ ep, data, inv, patch, onDelete, onRename }: {
  ep: EpisodeDef; data: ContentData; inv: InvestigationDef;
  patch: (fn: (i: InvestigationDef) => InvestigationDef) => void;
  onDelete: () => void; onRename: (name: string) => void;
}) {
  const [name, setName] = useState(inv.name);
  const [sel, setSel] = useState<string>(inv.hotspots[0]?.id ?? '');
  const [pickBg, setPickBg] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [subIndex, setSubIndex] = useState(0);
  const [sound, setSound] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: 'new' | 'move' | 'size'; id: string; sx: number; sy: number; orig: Hotspot } | null>(null);
  const hs = inv.hotspots.find((h) => h.id === sel);

  // stage state where the investigation starts in the script (for previews)
  const fromStep: Step = useMemo(() => {
    const { steps } = compileScript(ep.script, { characters: data.characters, assets: data.assets, startOutfit: ep.startOutfit, investigations: ep.investigations });
    const at = steps.find((s) => s.invest === inv.id);
    return at ?? {
      line: 0, speaker: null, text: '', narr: 'box', thought: false,
      bg: inv.bg ?? null, bgTransition: 'cut', cg: null, cgTransition: 'fade', cgPlay: 'loop', focus: false, item: null, blackout: false,
      chars: [], fx: [], bgm: null, se: [], camera: { ...CAMERA_HOME }, invest: inv.id,
    };
  }, [ep.script, ep.startOutfit, ep.investigations, data.characters, data.assets, inv.id, inv.bg]);
  const bgUrl = assetUrl(inv.bg ?? fromStep.bg);

  const sub = useMemo(
    () => (hs ? compileScript(hs.script, { characters: data.characters, assets: data.assets, startOutfit: ep.startOutfit, from: fromStep }) : null),
    [hs, data.characters, data.assets, ep.startOutfit, fromStep],
  );

  const patchHs = (id: string, p: Partial<Hotspot>) => patch((i) => ({ ...i, hotspots: i.hotspots.map((h) => (h.id === id ? { ...h, ...p } : h)) }));

  const pt = (e: React.PointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const down = (e: React.PointerEvent, id?: string, mode: 'move' | 'size' = 'move') => {
    e.stopPropagation();
    e.preventDefault();
    frame.current?.setPointerCapture(e.pointerId);
    const p = pt(e);
    if (id) {
      const h = inv.hotspots.find((x) => x.id === id)!;
      setSel(id); setSubIndex(0);
      drag.current = { mode, id, sx: p.x, sy: p.y, orig: h };
      return;
    }
    const h: Hotspot = { id: newId('hs'), label: `증거${inv.hotspots.length + 1}`, x: p.x, y: p.y, w: 0, h: 0, script: '' };
    patch((i) => ({ ...i, hotspots: [...i.hotspots, h] }));
    setSel(h.id); setSubIndex(0);
    drag.current = { mode: 'new', id: h.id, sx: p.x, sy: p.y, orig: h };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = pt(e);
    const r = (v: number) => Math.round(v * 10) / 10;
    if (d.mode === 'new') {
      patchHs(d.id, { x: r(Math.min(d.sx, p.x)), y: r(Math.min(d.sy, p.y)), w: r(Math.abs(p.x - d.sx)), h: r(Math.abs(p.y - d.sy)) });
    } else if (d.mode === 'move') {
      const x = Math.min(100 - d.orig.w, Math.max(0, d.orig.x + p.x - d.sx));
      const y = Math.min(100 - d.orig.h, Math.max(0, d.orig.y + p.y - d.sy));
      patchHs(d.id, { x: r(x), y: r(y) });
    } else {
      patchHs(d.id, { w: r(Math.max(2, d.orig.w + p.x - d.sx)), h: r(Math.max(2, d.orig.h + p.y - d.sy)) });
    }
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.mode === 'new') {
      const h = inv.hotspots.find((x) => x.id === d.id);
      // a plain click makes a default-sized box
      if (h && (h.w < 2 || h.h < 2)) patchHs(d.id, { w: 12, h: 14, x: Math.min(88, h.x - 6 < 0 ? 0 : h.x - 6), y: Math.min(86, h.y - 7 < 0 ? 0 : h.y - 7) });
    }
  };
  const removeHs = (id: string) => { patch((i) => ({ ...i, hotspots: i.hotspots.filter((h) => h.id !== id) })); setSel(''); };

  return (
    <section className="ed-invest-main">
      <div className="ed-row wrap">
        <label className="ed-field">이름
          <input className="ed-input" value={name} onChange={(e) => setName(e.target.value.replace(/\s+/g, '_'))}
            onBlur={() => { const n = name.trim(); if (n && n !== inv.name && !(ep.investigations ?? []).some((x) => x.name === n)) onRename(n); else setName(inv.name); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        </label>
        <label className="ed-field grow">고르는 동안 나오는 문구
          <input className="ed-input" value={inv.prompt ?? ''} placeholder="조사할 곳을 눌러 보세요." onChange={(e) => patch((i) => ({ ...i, prompt: e.target.value }))} />
        </label>
      </div>
      <div className="ed-row wrap">
        <span className="chip-label">배경</span>
        <button type="button" className="chip pick" onClick={() => setPickBg(true)}>{inv.bg ? data.assets.find((a) => a.id === inv.bg)?.name ?? '배경' : '대본의 현재 배경 그대로'} · 바꾸기…</button>
        {inv.bg && <button type="button" className="chip ghost" onClick={() => patch((i) => ({ ...i, bg: undefined }))}>현재 배경 그대로 쓰기</button>}
        <label className="ed-check"><input type="checkbox" checked={!!inv.keepChars} onChange={(e) => patch((i) => ({ ...i, keepChars: e.target.checked }))} /> 조사 중에도 인물을 화면에 둠</label>
        <span className="ed-spacer" />
        {confirmDel
          ? <><button type="button" className="text-btn danger" onClick={onDelete}>조사 삭제</button><button type="button" className="text-btn light" onClick={() => setConfirmDel(false)}>취소</button></>
          : <button type="button" className="text-btn light" onClick={() => setConfirmDel(true)}>조사 삭제</button>}
      </div>

      <p className="ed-help">빈 곳을 끌어서 증거 칸을 그리세요 (한 번 누르면 기본 크기). 칸을 끌면 이동, 오른쪽 아래 모서리를 끌면 크기 조절.</p>
      <div ref={frame} className="ed-hs-frame" onPointerDown={(e) => down(e)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {bgUrl ? <img src={bgUrl} alt="" draggable={false} /> : <span className="ed-empty">배경이 없습니다</span>}
        {inv.hotspots.map((h) => (
          <div key={h.id} className={`ed-hs${h.id === sel ? ' is-sel' : ''}${h.optional ? ' is-optional' : ''}`}
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            onPointerDown={(e) => down(e, h.id, 'move')}>
            <span>{h.label}</span>
            <i className="ed-hs-size" onPointerDown={(e) => down(e, h.id, 'size')} aria-hidden="true" />
          </div>
        ))}
      </div>

      {hs ? (
        <div className="ed-hs-edit">
          <div className="ed-hs-form">
            <div className="ed-row wrap">
              <label className="ed-field grow">증거 이름 (마우스를 올리면 보임)
                <input className="ed-input" value={hs.label} onChange={(e) => patchHs(hs.id, { label: e.target.value })} />
              </label>
              <label className="ed-check"><input type="checkbox" checked={!!hs.optional} onChange={(e) => patchHs(hs.id, { optional: e.target.checked })} /> 선택 (안 봐도 넘어감)</label>
              <button type="button" className="text-btn light" onClick={() => removeHs(hs.id)}>칸 삭제</button>
            </div>
            <label className="ed-field">이 증거를 눌렀을 때 대화 — 대본과 같은 방식으로 씁니다
              <textarea className="ed-input ed-hs-script" value={hs.script} spellCheck={false}
                placeholder={'@아이템 피묻은손수건\n(#놀람) 인물 A: 이건… 손수건?\n(#진지) 인물 B: 이니셜이 새겨져 있어.\n@아이템 끝'}
                onChange={(e) => { patchHs(hs.id, { script: e.target.value }); }} />
            </label>
            {sub && sub.diagnostics.length > 0 && (
              <ul className="ed-hs-diag">{sub.diagnostics.slice(0, 12).map((d, i) => <li key={i} className={`diag-${d.level}`}>{d.line + 1}줄 · {d.msg}</li>)}</ul>
            )}
          </div>
          <Preview
            step={sub?.steps[Math.min(subIndex, (sub?.steps.length ?? 1) - 1)]}
            index={Math.min(subIndex, Math.max(0, (sub?.steps.length ?? 1) - 1))}
            total={sub?.steps.length ?? 0}
            onIndex={setSubIndex}
            sound={sound}
            onSound={setSound}
          />
        </div>
      ) : inv.hotspots.length > 0 && <p className="ed-help">칸을 누르면 그 증거의 대화를 쓸 수 있습니다.</p>}

      {pickBg && <AssetPicker kind="bg" data={data} current={inv.bg} title="조사 배경 고르기" onClose={() => setPickBg(false)} onPick={(a) => { patch((i) => ({ ...i, bg: a.id })); setPickBg(false); }} />}
    </section>
  );
}
