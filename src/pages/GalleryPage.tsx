import { useEffect, useRef, useState } from 'react';
import { useContent, assetUrl } from '../content/store';
import type { AssetKind } from '../content/types';
import { useSeen } from '../lib/seen';
import { outfitOf } from '../content/sprites';

/** Gallery items come straight from the library (images with gallery on). */
export interface GalleryItem { id: string; category: string; title: string; src: string; width: number; height: number; caption?: string }
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
      };
    })
    .filter((i) => i.src);
  const [open, setOpen] = useState<number | null>(null);

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
        <ul className="photo-grid" role="tabpanel">
          {items.map((it, i) => (
            <li key={it.id} style={{ '--tilt': `${((i * 37) % 7) - 3}deg` } as React.CSSProperties}>
              <button type="button" className="photo" onClick={() => setOpen(i)}>
                <span className="photo-print" style={{ aspectRatio: `${it.width} / ${it.height}` }}>
                  <img src={it.src} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="photo-caption">{it.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open !== null && items[open] && (
        <Lightbox
          items={items}
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
