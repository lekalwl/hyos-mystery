import { useRef, useState } from 'react';
import type { AssetDef, AssetKind, ContentData } from '../content/types';
import { KIND_LABEL } from '../content/types';
import { assetUrl, updateContent } from '../content/store';
import { addFiles, importSpriteFiles, isAudio, removeAsset, renameAsset, replaceFile, SIZE_GUIDE, usageCount } from './assets';
import { outfitOf, outfitsOf } from '../content/sprites';

const KINDS: AssetKind[] = ['bg', 'cg', 'item', 'sprite', 'bgm', 'se'];

export function Dropzone({ kind, onFiles, label }: { kind: AssetKind; onFiles: (f: File[]) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const accept = isAudio(kind) ? 'audio/*' : 'image/*';
  return (
    <div
      className={`ed-drop${over ? ' is-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = [...e.dataTransfer.files].filter((x) => x.type.startsWith(isAudio(kind) ? 'audio' : 'image')); if (f.length) onFiles(f); }}
    >
      <button type="button" className="seal-btn small" onClick={() => input.current?.click()}>{label ?? `${KIND_LABEL[kind]} 올리기`}</button>
      <span>또는 파일을 여기로 끌어다 놓기 · 여러 개 가능</span>
      <small>권장: {SIZE_GUIDE[kind]}</small>
      <input ref={input} type="file" accept={accept} multiple hidden onChange={(e) => { const f = [...(e.target.files ?? [])]; if (f.length) onFiles(f); e.target.value = ''; }} />
    </div>
  );
}

export function LibraryTab({ data }: { data: ContentData }) {
  const [kind, setKind] = useState<AssetKind>('bg');
  const [busy, setBusy] = useState(false);
  const list = data.assets.filter((a) => a.kind === kind).sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const upload = async (files: File[]) => {
    setBusy(true);
    try { await addFiles(files, kind); } finally { setBusy(false); }
  };

  return (
    <div className="ed-library">
      <div className="ed-subtabs" role="tablist">
        {KINDS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>
            {KIND_LABEL[k]} <small>{data.assets.filter((a) => a.kind === k).length}</small>
          </button>
        ))}
      </div>
      {kind === 'sprite' ? <SpriteLibrary data={data} /> : <>
      <p className="ed-help">한 번 올린 파일은 여기 보관되고, 대본에서는 이름으로 부릅니다. 예: <code>@{({ bg: '배경', cg: '삽화', item: '아이템', bgm: '음악', se: '효과음' } as Record<string, string>)[kind]} {list[0]?.name ?? '이름'}</code>. 이름을 바꾸면 대본 속 이름도 같이 바뀝니다.</p>
      <Dropzone kind={kind} onFiles={upload} />
      {kind === 'bgm' && (
        <p className="ed-help">
          「메인 화면 음악」으로 고른 곡은 책상·메뉴 화면에서 작게 깔리고, 에피소드를 재생하면 꺼집니다.
          {data.menuBgm && <> <button type="button" className="text-btn light" onClick={() => updateContent((d) => ({ ...d, menuBgm: undefined }))}>메인 화면 음악 없애기</button></>}
        </p>
      )}
      {busy && <p className="ed-help">올리는 중…</p>}
      <ul className="ed-assets">
        {list.map((a) => <AssetCard key={a.id} a={a} data={data} />)}
      </ul>
      {list.length === 0 && <p className="ed-empty">아직 {KIND_LABEL[kind]}이(가) 없습니다.</p>}
      </>}
    </div>
  );
}

function AssetCard({ a, data }: { a: AssetDef; data: ContentData }) {
  const [name, setName] = useState(a.name);
  const [confirm, setConfirm] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);
  const url = assetUrl(a.id);
  const used = usageCount(a, data);
  return (
    <li className="ed-asset">
      <div className="ed-asset-thumb">
        {isAudio(a.kind) ? (url ? <audio src={url} controls preload="none" /> : <span>파일 없음</span>) : url ? <img src={url} alt="" loading="lazy" /> : <span>파일 없음</span>}
      </div>
      <label className="sr-only" htmlFor={`n-${a.id}`}>이름</label>
      <input
        id={`n-${a.id}`}
        className="ed-input"
        value={name}
        onChange={(e) => setName(e.target.value.replace(/\s+/g, '_'))}
        onBlur={() => { if (name.trim() && name !== a.name) renameAsset(a, name); else setName(a.name); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
      <p className="ed-asset-meta">
        {a.width ? `${a.width}×${a.height}` : a.mime ?? ''}
        {used !== null && <> · 대본 {used}곳</>}
      </p>
      <div className="ed-asset-actions">
        {!isAudio(a.kind) && (a.kind === 'cg' || a.kind === 'bg') && (
          <label className="ed-check">
            <input type="checkbox" checked={a.gallery !== false} onChange={(e) => updateContent((d) => ({ ...d, assets: d.assets.map((x) => (x.id === a.id ? { ...x, gallery: e.target.checked } : x)) }))} /> 갤러리
          </label>
        )}
        {a.kind === 'bgm' && (
          <label className="ed-check">
            <input type="radio" name="menu-bgm" checked={data.menuBgm === a.id}
              onChange={() => updateContent((d) => ({ ...d, menuBgm: a.id }))} /> 메인 화면 음악
          </label>
        )}
        <button type="button" className="text-btn light" onClick={() => replaceRef.current?.click()}>교체</button>
        {confirm ? (
          <>
            <button type="button" className="text-btn danger" onClick={() => removeAsset(a.id)}>삭제</button>
            <button type="button" className="text-btn light" onClick={() => setConfirm(false)}>취소</button>
          </>
        ) : (
          <button type="button" className="text-btn light" onClick={() => setConfirm(true)}>삭제</button>
        )}
        <input ref={replaceRef} type="file" hidden accept={isAudio(a.kind) ? 'audio/*' : 'image/*'} onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceFile(a, f); e.target.value = ''; }} />
      </div>
      {confirm && used ? <p className="ed-warn">대본 {used}곳에서 쓰는 중입니다. 지우면 그 자리는 임시 이미지로 바뀝니다.</p> : null}
    </li>
  );
}

/** Character sprites, grouped by character or by outfit. */
function SpriteLibrary({ data }: { data: ContentData }) {
  const [view, setView] = useState<'char' | 'outfit'>('char');
  const [charF, setCharF] = useState('');
  const [outfitF, setOutfitF] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const sprites = data.assets.filter((a) => a.kind === 'sprite');
  const allOutfits = Array.from(new Set(data.characters.flatMap((c) => outfitsOf(c, data.assets))));
  const shown = sprites.filter((a) =>
    (!charF || a.character === charF) && (!outfitF || outfitOf(a) === outfitF)
    && (!q || (a.expression ?? '').includes(q.trim())));
  const chars = data.characters.filter((c) => shown.some((a) => a.character === c.id));
  const byChar = (id: string) => shown.filter((a) => a.character === id);
  const charName = (id?: string) => data.characters.find((c) => c.id === id)?.name ?? id ?? '';
  const sortExpr = (a: AssetDef, b: AssetDef) => (a.expression ?? '').localeCompare(b.expression ?? '', 'ko');

  const upload = async (files: File[]) => {
    setBusy('올리는 중…');
    try {
      const r = await importSpriteFiles(files, { removePlaceholders: false });
      setBusy(`스프라이트 ${r.sprites}개 등록${r.created.length ? ` · 새 인물 ${r.created.join(', ')}` : ''}${r.skipped.length ? ` · 이름 규칙이 안 맞아 건너뜀 ${r.skipped.length}개` : ''}`);
    } catch (e) { setBusy(`실패: ${(e as Error).message}`); }
  };

  const groups = view === 'char'
    ? chars.map((c) => ({
        key: c.id, title: c.name, color: c.color, count: byChar(c.id).length,
        subs: outfitsOf(c, data.assets).map((o) => ({ key: o, title: o, items: byChar(c.id).filter((a) => outfitOf(a) === o).sort(sortExpr) })).filter((g) => g.items.length),
      }))
    : allOutfits.filter((o) => shown.some((a) => outfitOf(a) === o)).map((o) => ({
        key: o, title: o, color: undefined as string | undefined, count: shown.filter((a) => outfitOf(a) === o).length,
        subs: data.characters.map((c) => ({ key: c.id, title: c.name, items: byChar(c.id).filter((a) => outfitOf(a) === o).sort(sortExpr) })).filter((g) => g.items.length),
      }));

  return (
    <>
      <p className="ed-help">파일 이름을 <code>캐이름_의상이름_감정이름</code>으로 올리면 인물·의상·표정이 자동으로 정리됩니다. 인물별 세부 설정은 인물 탭에서 합니다.</p>
      <Dropzone kind="sprite" onFiles={upload} label="스프라이트 올리기" />
      {busy && <p className="ed-help">{busy}</p>}
      <div className="ed-spr-tools">
        <span className="ed-seg" role="group" aria-label="묶어 보기">
          <button type="button" aria-pressed={view === 'char'} onClick={() => setView('char')}>캐릭터별</button>
          <button type="button" aria-pressed={view === 'outfit'} onClick={() => setView('outfit')}>의상별</button>
        </span>
        <select className="ed-input narrow" value={charF} onChange={(e) => setCharF(e.target.value)} aria-label="인물 거르기">
          <option value="">모든 인물</option>
          {data.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="ed-input narrow" value={outfitF} onChange={(e) => setOutfitF(e.target.value)} aria-label="의상 거르기">
          <option value="">모든 의상</option>
          {allOutfits.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <input className="ed-input narrow" placeholder="표정 찾기" value={q} onChange={(e) => setQ(e.target.value)} aria-label="표정 찾기" />
        <small className="ed-help">{shown.length} / {sprites.length}개</small>
      </div>
      {groups.map((g) => (
        <section key={g.key} className="ed-spr-group">
          <h3>{g.color && <i style={{ background: g.color }} />}{g.title} <small>{g.count}개</small></h3>
          {g.subs.map((sg) => (
            <div key={sg.key} className="ed-spr-sub">
              <h4>{sg.title}{view === 'outfit' ? '' : ' 의상'}</h4>
              <ul className="ed-spr-list">
                {sg.items.map((a) => <SpriteCard key={a.id} a={a} label={view === 'char' ? `#${a.expression}` : `${charName(a.character)} #${a.expression}`} />)}
              </ul>
            </div>
          ))}
        </section>
      ))}
      {!groups.length && <p className="ed-empty">조건에 맞는 스프라이트가 없습니다.</p>}
    </>
  );
}

function SpriteCard({ a, label }: { a: AssetDef; label: string }) {
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const url = assetUrl(a.id);
  const shift = Math.max(0, ((a.top ?? 0) * 100) - 2);
  return (
    <li title={a.name}>
      <div className="ed-spr-img">{url && <img src={url} alt="" loading="lazy" style={{ transform: `translateY(-${shift}%)` }} />}</div>
      <span>{label}</span>
      <div className="ed-row">
        <button type="button" className="text-btn light" onClick={() => ref.current?.click()}>교체</button>
        {confirm
          ? <button type="button" className="text-btn danger" onClick={() => removeAsset(a.id)} onBlur={() => setConfirm(false)} autoFocus>정말 삭제</button>
          : <button type="button" className="text-btn light" onClick={() => setConfirm(true)}>삭제</button>}
      </div>
      <input ref={ref} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceFile(a, f); e.target.value = ''; }} />
    </li>
  );
}
