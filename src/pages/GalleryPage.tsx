import { useEffect, useRef, useState } from 'react';
import { useContent, assetUrl } from '../content/store';
import type { AssetKind } from '../content/types';
import { useSeen } from '../lib/seen';
import { outfitOf } from '../content/sprites';

/** Gallery items come straight from the library (images with gallery on). */
export interface GalleryItem { id: string; category: string; title: string; src: string; width: number; height: number; caption?: string; character?: string; outfit?: string; expression?: string }
const galleryCategories: { id: string; label: string; labelEn: string; kinds: AssetKind[] }[] = [
  { id: 'illustration', label: '일러스트', labelEn: 'Illustrations', kinds: ['cg'] },
  { id: 'sprite', label: '스탠딩', labelEn: 'Sprites', kinds: ['sprite'] },
  { id: 'background', label: '배경', labelEn: 'Backgrounds', kinds: ['bg'] },
  { id: 'item', label: '증거·아이템', labelEn: 'Evidence', kinds: ['item'] },
];
import { navigate } from '../lib/router';
import { SubPage } from '../components/SubPage';

export function GalleryPage({ category }: { category?: string }) {
  const cat = galleryCategories.find((c) => c.id === category)?.id ?? galleryCategories[0].id;
  const { data } = useContent();
  const seen = useSeen();
  const kinds = galleryCategories.find((c) => c.id === cat)!.kinds;
  const pool = data.assets.filter((a) => kinds.includes(a.kind) && a.gallery !== false);
  const locked = pool.filter((a) => !seen.has(a.id, false)).length;
  const items: GalleryItem[] = pool
    .filter((a) => seen.has(a.id))
    .map((a) => {
      const owner = a.character ? data.characters.find((c) => c.id === a.character)?.name : undefined;
      return {
        id: a.id, category: cat, src: assetUrl(a.id) ?? '',
        title: owner ? `${owner} · ${outfitOf(a)} · ${a.expression ?? a.name}` : a.name,
        width: a.width ?? 1600, height: a.height ?? 900,
        character: a.character, outfit: a.kind === 'sprite' ? outfitOf(a) : undefined, expression: a.expression,
      };
    })
    .filter((i) => i.src);
  const [open, setOpen] = useState<number | null>(null);

  // standing sprites: browse by character or by outfit
  const isSprite = cat === 'sprite';
  const [view, setView] = useState<'char' | 'outfit'>('char');
  const [pick, setPick] = useState('');
  const charOrder = new Map(data.characters.map((c, i) => [c.id, i]));
  const charName = (id?: string) => data.characters.find((c) => c.id === id)?.name ?? '';
  const outfitList = Array.from(new Set(data.characters.flatMap((c) => c.outfits ?? []).concat(items.map((i) => i.outfit ?? ''))))
    .filter((o) => o && items.some((i) => i.outfit === o));
  const charList = data.characters.filter((c) => items.some((i) => i.character === c.id));
  const options = view === 'char' ? charList.map((c) => ({ key: c.id, label: c.name, color: c.color })) : outfitList.map((o) => ({ key: o, label: o, color: undefined as string | undefined }));
  const curPick = options.some((o) => o.key === pick) ? pick : '';
  const groups: { key: string; title: string; color?: string; items: GalleryItem[] }[] = !isSprite
    ? [{ key: 'all', title: '', items }]
    : options
        .filter((o) => !curPick || o.key === curPick)
        .map((o) => ({
          key: o.key, title: o.label, color: o.color,
          items: items
            .filter((i) => (view === 'char' ? i.character === o.key : i.outfit === o.key))
            .sort((a, b) => view === 'char'
              ? (outfitList.indexOf(a.outfit ?? '') - outfitList.indexOf(b.outfit ?? '')) || (a.expression ?? '').localeCompare(b.expression ?? '', 'ko')
              : ((charOrder.get(a.character ?? '') ?? 0) - (charOrder.get(b.character ?? '') ?? 0)) || (a.expression ?? '').localeCompare(b.expression ?? '', 'ko')),
        }))
        .filter((g) => g.items.length);
  const shownItems = groups.flatMap((g) => g.items);
  const caption = (it: GalleryItem) => !isSprite ? it.title
    : view === 'char' ? `${it.outfit} · ${it.expression}` : `${charName(it.character)} · ${it.expression}`;

  return (
    <SubPage kind="gallery" eyebrow="Gallery" title="갤러리">
      <div className="album-page">
        <div className="album-tabs" role="tablist" aria-label="분류">
          {galleryCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === cat}
              className="album-tab"
              onClick={() => { setOpen(null); navigate(`gallery-${c.id}`, { replace: true }); }}
            >
              {c.label}
              <small>{c.labelEn}</small>
            </button>
          ))}
        </div>

        {items.length === 0 && <p className="gallery-empty">{locked ? '이야기를 읽으며 본 장면이 여기에 모입니다.' : '아직 등록된 이미지가 없습니다.'}</p>}
        {locked > 0 && <p className="gallery-locked">아직 보지 못한 {locked}장{seen.operator ? ' · 운영자 브라우저라 모두 보입니다' : ''}</p>}
        {isSprite && items.length > 0 && (
          <div className="sprite-filter">
            <div className="sprite-view" role="group" aria-label="묶어 보기">
              <button type="button" aria-pressed={view === 'char'} onClick={() => { setView('char'); setPick(''); setOpen(null); }}>캐릭터별</button>
              <button type="button" aria-pressed={view === 'outfit'} onClick={() => { setView('outfit'); setPick(''); setOpen(null); }}>의상별</button>
            </div>
            <div className="sprite-chips" role="group" aria-label={view === 'char' ? '인물' : '의상'}>
              <button type="button" aria-pressed={!curPick} onClick={() => { setPick(''); setOpen(null); }}>전체</button>
              {options.map((o) => (
                <button key={o.key} type="button" aria-pressed={curPick === o.key} onClick={() => { setPick(o.key); setOpen(null); }}>
                  {o.color && <i style={{ background: o.color }} aria-hidden="true" />}{o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div role="tabpanel">
          {groups.map((g) => {
            const offset = shownItems.indexOf(g.items[0]);
            return (
              <section key={g.key} className={isSprite ? 'sprite-group' : undefined}>
                {isSprite && <h2 className="sprite-group-title">{g.color && <i style={{ background: g.color }} aria-hidden="true" />}{g.title}<small>{g.items.length}장</small></h2>}
                <ul className={`photo-grid${isSprite ? ' is-sprites' : ''}`}>
                  {g.items.map((it, j) => (
                    <li key={it.id} style={{ '--tilt': `${(((offset + j) * 37) % 7) - 3}deg` } as React.CSSProperties}>
                      <button type="button" className="photo" onClick={() => setOpen(offset + j)}>
                        <span className="photo-print" style={{ aspectRatio: `${it.width} / ${it.height}` }}>
                          <img src={it.src} alt="" loading="lazy" decoding="async" />
                        </span>
                        <span className="photo-caption">{caption(it)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {open !== null && shownItems[open] && (
        <Lightbox
          items={shownItems}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </SubPage>
  );
}

function Lightbox({ items, index, onIndex, onClose }: { items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const it = items[index];
  const [zoom, setZoom] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setZoom(false); }, [index]);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndex]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={it.title}>
      <div className="lightbox-bar">
        <p><strong>{it.title}</strong> {it.caption && <span>· {it.caption}</span>} <span className="dim">{index + 1} / {items.length}</span></p>
        <div className="lightbox-actions">
          <button type="button" className="vn-btn" onClick={() => setZoom((z) => !z)} aria-pressed={zoom}>{zoom ? '화면 맞춤' : '원본 크기'}</button>
          <button type="button" className="vn-btn" onClick={onClose} ref={closeRef}>닫기</button>
        </div>
      </div>
      <div className={`lightbox-stage${zoom ? ' is-zoomed' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <img src={it.src} alt={it.title} width={it.width} height={it.height} onClick={() => setZoom((z) => !z)} />
      </div>
      {items.length > 1 && (
        <>
          <button type="button" className="lb-nav lb-prev" aria-label="이전 이미지" onClick={() => onIndex((index - 1 + items.length) % items.length)}>‹</button>
          <button type="button" className="lb-nav lb-next" aria-label="다음 이미지" onClick={() => onIndex((index + 1) % items.length)}>›</button>
        </>
      )}
    </div>
  );
}
