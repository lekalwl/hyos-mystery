import { useRef, useState } from 'react';
import type { AssetDef, AssetKind, ContentData } from '../content/types';
import { KIND_LABEL } from '../content/types';
import { assetUrl, updateContent } from '../content/store';
import { addFiles, isAudio, removeAsset, renameAsset, replaceFile, SIZE_GUIDE, usageCount } from './assets';

const KINDS: AssetKind[] = ['bg', 'cg', 'item', 'bgm', 'se'];

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
