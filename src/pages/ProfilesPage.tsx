import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useContent, assetUrl, spriteUrl, boardPhoto, cropStyle } from '../content/store';
import { outfitOf, outfitsOf, spritesOf } from '../content/sprites';
import { useSeen } from '../lib/seen';
import type { CharacterDef, ContentData } from '../content/types';
import { navigate } from '../lib/router';
import { SubPage } from '../components/SubPage';

/**
 * Case board: character photos pinned to cork and tied together with red
 * string (left). Picking a photo slides a folded dossier sheet out from
 * behind the board and unfolds it (right).
 */

// Per-slot scatter so the board looks hand-pinned, not gridded.
const TILTS = [-4, 3, 2, -3, -2, 4, 3, -4];

interface Pin { x: number; y: number }

export function ProfilesPage({ id }: { id?: string }) {
  const { data } = useContent();
  const seen = useSeen();
  const characters = data.characters;
  const known = (c: CharacterDef) => !!c.alwaysShown || seen.has(`char:${c.id}`);
  const current = characters.find((c) => c.id === id && known(c));
  const cols = characters.length > 6 ? 3 : 2;
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Measure pin points (top-centre of each card) for the string overlay.
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      const b = board.getBoundingClientRect();
      setSize({ w: b.width, h: b.height });
      setPins(
        cardRefs.current.map((el) => {
          if (!el) return { x: 0, y: 0 };
          const r = el.getBoundingClientRect();
          return { x: r.left - b.left + r.width / 2, y: r.top - b.top + 14 };
        }),
      );
    };
    measure();
    // re-measure once the pin-in animation and images have settled
    const t = window.setTimeout(measure, 900);
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    document.fonts?.ready.then(measure);
    return () => { ro.disconnect(); window.clearTimeout(t); };
  }, [characters.length]);

  const select = (cid: string) => {
    if (cid === current?.id) return;
    navigate(`profile-${cid}`, { replace: !!current });
  };
  const close = () => navigate('profiles', { replace: true });

  // Esc folds the sheet away
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);

  // string links: neighbours + every other card, like a hand-strung web
  const links: [number, number][] = [];
  for (let i = 0; i < pins.length; i++) {
    if (i + 1 < pins.length) links.push([i, i + 1]);
    if (i + 3 < pins.length && i % 2 === 0) links.push([i, i + 3]);
  }
  const curIdx = characters.findIndex((c) => c.id === current?.id);

  return (
    <SubPage kind="profiles" eyebrow="Profiles" title="인물">
      <div className={`caseboard-wrap${current ? ' has-file' : ''}`}>
        <section className="caseboard" aria-label="인물 사건 보드">
          <span className="board-plate" aria-hidden="true">Case Board</span>

          <div className="board-field" ref={boardRef}>
            <svg className="board-strings" width={size.w} height={size.h} aria-hidden="true">
              {links.map(([a, b]) => {
                const p = pins[a], q = pins[b];
                if (!p || !q) return null;
                const sag = Math.min(40, Math.hypot(q.x - p.x, q.y - p.y) * 0.12);
                const hot = a === curIdx || b === curIdx;
                return (
                  <path
                    key={`${a}-${b}`}
                    className={hot ? 'is-hot' : undefined}
                    d={`M${p.x} ${p.y} Q${(p.x + q.x) / 2} ${(p.y + q.y) / 2 + sag} ${q.x} ${q.y}`}
                  />
                );
              })}
            </svg>

            <ul className={`board-cards cols-${cols}`}>
              {characters.map((c, i) => {
                const isKnown = known(c);
                const photo = boardPhoto(c);
                return (
                  <li key={c.id} className={`slot slot-${i % cols}`} style={{ '--tilt': `${TILTS[i % TILTS.length]}deg`, '--d': `${i * 60}ms` } as CSSProperties}>
                    <button
                      type="button"
                      ref={(el) => { cardRefs.current[i] = el; }}
                      className={`board-card${c.id === current?.id ? ' is-current' : ''}${isKnown ? '' : ' is-unknown'}`}
                      aria-pressed={c.id === current?.id}
                      aria-controls="dossier"
                      disabled={!isKnown}
                      aria-label={isKnown ? c.name : '아직 만나지 않은 인물'}
                      onClick={() => select(c.id)}
                    >
                      <span className="pushpin" aria-hidden="true" />
                      <span className="card-photo is-cropped">
                        {isKnown ? <img src={photo.url ?? ''} alt="" style={cropStyle(photo.crop, photo.ratio) as CSSProperties} /> : <span className="card-unknown" aria-hidden="true">?</span>}
                      </span>
                      <span className="card-name">{isKnown ? c.name : '???'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <div className="file-slot" id="dossier" aria-live="polite">
          {current ? (
            <article className="dossier-sheet" key={current.id}>
              <button type="button" className="sheet-close" onClick={close} aria-label="기록 접기">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.6" /></svg>
              </button>
              <header className="sheet-head">
                <span className="sheet-stamp">{current.placeholder ? '임시' : '기록'}</span>
                <p className="sheet-kicker">Personal Record · No. {String(curIdx + 1).padStart(3, '0')}</p>
                <h2>{current.name}</h2>
                {current.nameEn && <p className="sheet-en">{current.nameEn}</p>}
              </header>

              <div className="sheet-body">
                <SpriteViewer c={current} data={data} has={seen.has} />
                <div className="sheet-text">
                  {current.epithet && <p className="sheet-epithet">{current.epithet}</p>}
                  <p className="sheet-intro">{current.intro}</p>
                  <dl className="sheet-fields">
                    {current.fields.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              {current.placeholder && <p className="sheet-foot">임시 등록 인물 · 실제 자료로 교체 예정</p>}
            </article>
          ) : (
            <div className="file-folded" aria-hidden="false">
              <span className="folded-sheet" aria-hidden="true" />
              <p>보드의 사진을 고르면<br />기록이 펼쳐집니다</p>
            </div>
          )}
        </div>
      </div>
    </SubPage>
  );
}

/** Outfit tabs + expression strip. Only sprites this reader has seen. */
function SpriteViewer({ c, data, has }: { c: CharacterDef; data: ContentData; has: (k: string) => boolean }) {
  const all = spritesOf(c.id, data.assets);
  const visible = all.filter((a) => has(a.id));
  const outfits = outfitsOf(c, data.assets).filter((o) => visible.some((a) => outfitOf(a) === o));
  const [outfit, setOutfit] = useState(outfits[0]);
  const cur = outfits.includes(outfit) ? outfit : outfits[0];
  const list = visible.filter((a) => outfitOf(a) === cur);
  const [sel, setSel] = useState<string | null>(null);
  const shown = list.find((a) => a.id === sel) ?? list.find((a) => a.expression === '일반' || a.expression === '기본') ?? list[0];
  const hidden = all.length - visible.length;

  if (!all.length) {
    return (
      <figure className="sheet-photo">
        <span className="paperclip" aria-hidden="true" />
        <img src={spriteUrl(c.id) ?? ''} alt={`${c.name} 스탠딩 이미지`} />
      </figure>
    );
  }
  return (
    <div className="sheet-viewer">
      {outfits.length > 1 && (
        <div className="outfit-tabs" role="tablist" aria-label="의상">
          {outfits.map((o) => (
            <button key={o} type="button" role="tab" aria-selected={o === cur} onClick={() => { setOutfit(o); setSel(null); }}>{o}</button>
          ))}
        </div>
      )}
      <figure className="sheet-photo">
        <span className="paperclip" aria-hidden="true" />
        {shown ? <img key={shown.id} src={assetUrl(shown.id) ?? ''} alt={`${c.name} ${cur} ${shown.expression}`} /> : <span className="sheet-nophoto">아직 본 모습이 없습니다</span>}
      </figure>
      {list.length > 1 && (
        <ul className="expr-strip" aria-label="표정">
          {list.map((a) => (
            <li key={a.id}>
              <button type="button" aria-pressed={a.id === shown?.id} onClick={() => setSel(a.id)} title={a.expression}>
                <span className="expr-face" style={{ '--top': a.top ?? 0.05 } as CSSProperties}><img src={assetUrl(a.id) ?? ''} alt="" /></span>
                <span>{a.expression}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && <p className="expr-locked">아직 보지 못한 모습 {hidden}개</p>}
    </div>
  );
}
