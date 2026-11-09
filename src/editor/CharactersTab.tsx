import { useRef, useState } from 'react';
import type { CharacterDef, ContentData } from '../content/types';
import { assetUrl, newId, updateContent, boardPhoto, cropStyle } from '../content/store';
import { COMMON_EXPRESSIONS } from '../engine/vocab';
import { addFiles, filesFromDrop, importSpriteFiles, removeAsset, replaceFile, SIZE_GUIDE, type SpriteImportReport } from './assets';
import { outfitOf, outfitsOf } from '../content/sprites';

const patchChar = (id: string, patch: Partial<CharacterDef>) =>
  updateContent((d) => ({ ...d, characters: d.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

export function CharactersTab({ data }: { data: ContentData }) {
  const [sel, setSel] = useState<string | undefined>(data.characters[0]?.id);
  const c = data.characters.find((x) => x.id === sel) ?? data.characters[0];
  const [confirmDel, setConfirmDel] = useState(false);

  const addChar = () => {
    const id = newId('ch');
    updateContent((d) => ({
      ...d,
      characters: [...d.characters, {
        id, name: `새 인물 ${d.characters.length + 1}`, aliases: [], color: '#d8bc83', intro: '',
        fields: ['이름', '나이', '직업', '관계'].map((label) => ({ label, value: '' })),
      }],
    }));
    setSel(id);
  };

  return (
    <>
    <BulkImport hasPlaceholders={data.characters.some((x) => x.placeholder)} />
    <div className="ed-chars">
      <aside className="ed-list">
        <ul>
          {data.characters.map((x) => (
            <li key={x.id}>
              <button type="button" className={x.id === c?.id ? 'is-current' : ''} onClick={() => { setSel(x.id); setConfirmDel(false); }}>
                <span className="dot" style={{ background: x.color }} />{x.name}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="text-btn light" onClick={addChar}>+ 인물 추가</button>
      </aside>

      {c && (
        <div className="ed-char-detail" key={c.id}>
          <div className="ed-form">
            <Field label="이름 (대본에서 부르는 이름)" value={c.name} onChange={(v) => patchChar(c.id, { name: v })} />
            <Field label="영문 표기" value={c.nameEn ?? ''} onChange={(v) => patchChar(c.id, { nameEn: v })} />
            <Field label="다른 표기 (쉼표로 구분)" value={c.aliases.join(', ')} onChange={(v) => patchChar(c.id, { aliases: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <div className="ed-field">
              <label htmlFor={`col-${c.id}`}>이름표 색</label>
              <div className="ed-row">
                <input id={`col-${c.id}`} type="color" value={/^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#d8bc83'} onChange={(e) => patchChar(c.id, { color: e.target.value })} />
                <span className="ed-name-sample" style={{ color: c.color }}>{c.name}</span>
              </div>
            </div>
            <Field label="한 줄 소개" value={c.epithet ?? ''} onChange={(v) => patchChar(c.id, { epithet: v })} />
            <div className="ed-field">
              <label htmlFor={`intro-${c.id}`}>소개문</label>
              <textarea id={`intro-${c.id}`} className="ed-input" rows={4} value={c.intro} onChange={(e) => patchChar(c.id, { intro: e.target.value })} />
            </div>
            <div className="ed-field">
              <span className="ed-label">프로필 항목</span>
              {c.fields.map((f, i) => (
                <div className="ed-row" key={i}>
                  <input className="ed-input narrow" aria-label="항목 이름" value={f.label} onChange={(e) => patchChar(c.id, { fields: c.fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <input className="ed-input" aria-label="내용" value={f.value} onChange={(e) => patchChar(c.id, { fields: c.fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                  <button type="button" className="text-btn light" aria-label="항목 빼기" onClick={() => patchChar(c.id, { fields: c.fields.filter((_, j) => j !== i) })}>✕</button>
                </div>
              ))}
              <button type="button" className="text-btn light" onClick={() => patchChar(c.id, { fields: [...c.fields, { label: '', value: '' }] })}>+ 항목</button>
            </div>
            <label className="ed-check"><input type="checkbox" checked={!!c.placeholder} onChange={(e) => patchChar(c.id, { placeholder: e.target.checked })} /> 임시 인물 표시 (프로필에 「임시」 도장)</label>
            <div className="ed-field">
              <label htmlFor={`lift-${c.id}`}>무대 높이 (키 작은 캐릭터를 올려서 상체가 보이게)</label>
              <div className="ed-row">
                <input id={`lift-${c.id}`} type="range" min={0} max={60} step={1} value={c.stageLift ?? 0} disabled={c.stageLift === undefined} onChange={(e) => patchChar(c.id, { stageLift: Number(e.target.value) })} />
                <label className="ed-check"><input type="checkbox" checked={c.stageLift === undefined} onChange={(e) => patchChar(c.id, { stageLift: e.target.checked ? undefined : 20 })} /> 자동</label>
                {c.stageLift !== undefined && <span className="ed-help">{c.stageLift}%</span>}
              </div>
            </div>
            <label className="ed-check"><input type="checkbox" checked={!c.noFlip} onChange={(e) => patchChar(c.id, { noFlip: !e.target.checked })} /> 오른쪽에 서면 좌우 반전 (글자·비대칭 디자인이면 끄기)</label>
            <label className="ed-check"><input type="checkbox" checked={!!c.alwaysShown} onChange={(e) => patchChar(c.id, { alwaysShown: e.target.checked })} /> 처음부터 프로필에 공개 (끄면 이야기에서 이름이 나온 뒤 공개)</label>
            <div className="ed-row">
              {confirmDel ? (
                <>
                  <span className="ed-warn">이 인물과 스프라이트를 모두 지울까요?</span>
                  <button type="button" className="text-btn danger" onClick={() => {
                    data.assets.filter((a) => a.character === c.id).forEach((a) => removeAsset(a.id));
                    updateContent((d) => ({ ...d, characters: d.characters.filter((x) => x.id !== c.id) }));
                    setConfirmDel(false); setSel(undefined);
                  }}>삭제</button>
                  <button type="button" className="text-btn light" onClick={() => setConfirmDel(false)}>취소</button>
                </>
              ) : <button type="button" className="text-btn light" onClick={() => setConfirmDel(true)}>인물 삭제</button>}
            </div>
          </div>

          <div className="ed-art">
            <Portrait c={c} data={data} />
            <Sprites c={c} data={data} />
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useRef(`f-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className="ed-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="ed-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Portrait({ c, data }: { c: CharacterDef; data: ContentData }) {
  const input = useRef<HTMLInputElement>(null);
  const existing = data.assets.find((a) => a.kind === 'portrait' && a.character === c.id);
  const { url, ratio, crop } = boardPhoto(c);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const set = (next: Partial<typeof crop>) => {
    const v = { ...crop, ...next };
    v.zoom = Math.min(5, Math.max(0.5, v.zoom));
    v.cx = Math.min(1.2, Math.max(-0.2, v.cx));
    v.cy = Math.min(1.2, Math.max(-0.2, v.cy));
    patchChar(c.id, { photoCrop: v });
  };

  return (
    <section className="ed-portrait">
      <h3>사건보드 사진</h3>
      <p className="ed-help">사진을 끌어서 위치를, 슬라이더나 마우스 휠로 크기를 맞추세요. 초상을 따로 올리지 않으면 기본 스프라이트를 씁니다.</p>
      <div
        ref={frame}
        className="ed-crop"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, cx: crop.cx, cy: crop.cy }; }}
        onPointerMove={(e) => {
          const d = drag.current; const box = frame.current?.getBoundingClientRect();
          if (!d || !box) return;
          const dx = (e.clientX - d.x) / box.width;            // in frame widths
          const dy = (e.clientY - d.y) / box.height;           // in frame heights
          set({ cx: d.cx - dx / crop.zoom, cy: d.cy - (dy * 0.75) / (crop.zoom * ratio) });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onWheel={(e) => { e.preventDefault(); set({ zoom: crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) }); }}
      >
        {url && <img src={url} alt="" draggable={false} style={cropStyle(crop, ratio)} />}
        <span className="ed-crop-hint" aria-hidden="true">끌어서 이동</span>
      </div>
      <div className="ed-row">
        <label className="sr-only" htmlFor={`zoom-${c.id}`}>확대</label>
        <input id={`zoom-${c.id}`} type="range" min={0.5} max={5} step={0.05} value={crop.zoom} onChange={(e) => set({ zoom: Number(e.target.value) })} />
        <span className="ed-help">{crop.zoom.toFixed(2)}×</span>
        <button type="button" className="text-btn light" onClick={() => patchChar(c.id, { photoCrop: undefined })}>자동으로</button>
      </div>
      <div className="ed-row">
        <button type="button" className="text-btn light" onClick={() => input.current?.click()}>{existing ? '초상 교체' : '초상 따로 올리기'}</button>
        {existing && <button type="button" className="text-btn light" onClick={() => removeAsset(existing.id)}>초상 삭제</button>}
      </div>
      <small>{SIZE_GUIDE.portrait}</small>
      <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = '';
        if (!f) return;
        if (existing) await replaceFile(existing, f);
        else await addFiles([f], 'portrait', { character: c.id });
      }} />
    </section>
  );
}

function Sprites({ c, data }: { c: CharacterDef; data: ContentData }) {
  const outfits = outfitsOf(c, data.assets);
  const [outfit, setOutfit] = useState(outfits[0]);
  const cur = outfits.includes(outfit) ? outfit : outfits[0];
  const sprites = data.assets.filter((a) => a.kind === 'sprite' && a.character === c.id && outfitOf(a) === cur);
  const [expr, setExpr] = useState('');
  const [newOutfit, setNewOutfit] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<string>('');
  const missing = COMMON_EXPRESSIONS.filter((x) => !sprites.some((s) => s.expression === x));
  const pick = (e: string) => { target.current = e; input.current?.click(); };
  const setOutfits = (list: string[]) => patchChar(c.id, { outfits: list });

  return (
    <section className="ed-sprites">
      <h3>의상 · 표정별 스프라이트</h3>
      <p className="ed-help">{SIZE_GUIDE.sprite}. 첫 번째 의상이 기본 의상입니다. 대본에서 <code>(#표정)</code>, 의상은 <code>(#{outfits[1] ?? '의상이름'})</code> 또는 <code>@의상 {c.name} {outfits[1] ?? '의상이름'}</code>.</p>
      <div className="ed-row wrap ed-outfits">
        {outfits.map((o, i) => (
          <span key={o} className={`ed-outfit${o === cur ? ' is-current' : ''}`}>
            <button type="button" onClick={() => setOutfit(o)}>{o}{i === 0 && <small> 기본</small>}</button>
            {i > 0 && <button type="button" aria-label={`${o}을 기본 의상으로`} title="기본 의상으로" onClick={() => setOutfits([o, ...outfits.filter((x) => x !== o)])}>★</button>}
          </span>
        ))}
        <input className="ed-input narrow" placeholder="새 의상" aria-label="새 의상 이름" value={newOutfit} onChange={(e) => setNewOutfit(e.target.value.replace(/[\s#()_]/g, ''))} />
        <button type="button" className="text-btn light" disabled={!newOutfit || outfits.includes(newOutfit)} onClick={() => { setOutfits([...outfits, newOutfit]); setOutfit(newOutfit); setNewOutfit(''); }}>+ 의상</button>
      </div>
      <ul className="ed-sprite-grid">
        {sprites.map((s) => (
          <li key={s.id}>
            <img src={assetUrl(s.id) ?? ''} alt="" />
            <span className="ed-sprite-name">#{s.expression}</span>
            <div className="ed-row">
              <button type="button" className="text-btn light" onClick={() => pick(s.expression!)}>교체</button>
              <button type="button" className="text-btn light" onClick={() => removeAsset(s.id)}>삭제</button>
            </div>
          </li>
        ))}
      </ul>
      {!sprites.length && <p className="ed-help">{cur} 의상의 스프라이트가 아직 없습니다.</p>}
      <div className="ed-row wrap">
        <input className="ed-input narrow" placeholder="표정 이름" aria-label="새 표정 이름" value={expr} onChange={(e) => setExpr(e.target.value.replace(/[\s#()_]/g, ''))} />
        <button type="button" className="seal-btn small" onClick={() => pick(expr)}>{expr ? `${cur} · #${expr} 올리기` : `${cur}에 파일 이름으로 여러 개 올리기`}</button>
      </div>
      {missing.length > 0 && (
        <p className="ed-help">자주 쓰는 표정 중 없는 것: {missing.map((m) => <button key={m} type="button" className="chip ghost" onClick={() => pick(m)}>{m}</button>)}</p>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={async (e) => {
        const files = [...(e.target.files ?? [])]; e.target.value = '';
        if (!files.length) return;
        const ex = target.current;
        if (ex && files.length === 1) await addFiles(files, 'sprite', { character: c.id, outfit: cur, expression: ex });
        else for (const f of files) await addFiles([f], 'sprite', { character: c.id, outfit: cur, expression: f.name.replace(/\.[^.]+$/, '').split('_').pop() });
        setExpr('');
      }} />
    </section>
  );
}

/** Drop a whole folder named 캐이름_의상_감정.png → characters + outfits + sprites. */
function BulkImport({ hasPlaceholders }: { hasPlaceholders: boolean }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clean, setClean] = useState(true);
  const [report, setReport] = useState<SpriteImportReport | null>(null);
  const dirInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const run = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true); setReport(null);
    try { setReport(await importSpriteFiles(files, { removePlaceholders: hasPlaceholders && clean })); }
    finally { setBusy(false); }
  };

  return (
    <section
      className={`ed-bulk${over ? ' is-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => { e.preventDefault(); setOver(false); run(await filesFromDrop(e.dataTransfer)); }}
    >
      <div>
        <h3>스프라이트 폴더 한 번에 등록</h3>
        <p className="ed-help">파일 이름 규칙 <code>캐이름_의상이름_감정이름.png</code> — 예: <code>엘리_평상복_기쁨.png</code>, <code>엘리_인게임_놀람.png</code>. 없는 인물은 새로 만들고, 같은 인물·의상·감정은 덮어씁니다. 폴더째 끌어다 놓아도 됩니다.</p>
        {hasPlaceholders && <label className="ed-check"><input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} /> 임시 인물(인물 A~F)은 지우기</label>}
      </div>
      <div className="ed-row wrap">
        <button type="button" className="seal-btn small" disabled={busy} onClick={() => dirInput.current?.click()}>폴더 고르기</button>
        <button type="button" className="text-btn light" disabled={busy} onClick={() => fileInput.current?.click()}>파일 고르기</button>
      </div>
      {busy && <p className="ed-help">등록하는 중…</p>}
      {report && (
        <p className="ed-report" role="status">
          스프라이트 {report.sprites}개 등록 · 새 인물 {report.created.length}명{report.created.length ? ` (${report.created.join(', ')})` : ''}
          {report.updated.length ? ` · 기존 인물 ${report.updated.length}명에 추가` : ''}
          {report.skipped.length ? ` · 이름 규칙에 안 맞아 건너뜀: ${report.skipped.join(', ')}` : ''}
        </p>
      )}
      <input ref={dirInput} type="file" hidden multiple {...{ webkitdirectory: '' }} onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ''; run(f); }} />
      <input ref={fileInput} type="file" hidden multiple accept="image/*" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ''; run(f); }} />
    </section>
  );
}
