import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { navigate } from '../../lib/router';
import { prefersReducedMotion } from '../../lib/motion';
import { deskAssets } from '../../data/assets';
import { DeskObject } from './DeskObject';
import { tallLayout, wideLayout, type DeskLayout, type MenuKey, type DecoKey } from './layouts';
import { Candle, Inkwell, LetterOpener, LoosePhoto, Magnifier, Papers } from './Decorations';
import { EpisodeBook } from '../objects/EpisodeBook';
import { ProfileLocket } from '../objects/ProfileLocket';
import { GalleryAlbum } from '../objects/GalleryAlbum';
import { RulesScroll } from '../objects/RulesScroll';

const MENU: Record<MenuKey, { en: string; ko: string; desc: string; Art: () => JSX.Element }> = {
  episodes: { en: 'Episodes', ko: '에피소드', desc: '에피소드 목록을 펼쳐 이야기를 읽습니다.', Art: EpisodeBook },
  profiles: { en: 'Profiles', ko: '인물', desc: '등장인물의 초상과 기록을 봅니다.', Art: ProfileLocket },
  gallery: { en: 'Gallery', ko: '갤러리', desc: '일러스트와 스탠딩 이미지를 감상합니다.', Art: GalleryAlbum },
  rules: { en: 'Rules', ko: '규칙', desc: '게임의 기본 규칙을 읽습니다.', Art: RulesScroll },
};

const DECO: Record<DecoKey, () => JSX.Element> = {
  candle: Candle,
  inkwell: Inkwell,
  magnifier: Magnifier,
  opener: LetterOpener,
  papers: Papers,
  photo1: LoosePhoto,
  photo2: LoosePhoto,
};

/** Duration of each object's opening sequence before the page changes. */
const LEAVE_MS = 1000;

function useDeskLayout(): DeskLayout {
  const pick = () => (window.innerWidth / window.innerHeight < 0.9 ? tallLayout : wideLayout);
  const [layout, setLayout] = useState<DeskLayout>(pick);
  useEffect(() => {
    const on = () => setLayout(pick());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return layout;
}

export function Desk() {
  const layout = useDeskLayout();
  const stageRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState<MenuKey | null>(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50, vx: 50, vy: 50 });
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const activate = (key: MenuKey, el: HTMLButtonElement) => {
    if (leaving) return;
    if (prefersReducedMotion()) {
      navigate(key);
      return;
    }
    const stage = stageRef.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setOrigin({
      x: ((r.left + r.width / 2 - stage.left) / stage.width) * 100,
      y: ((r.top + r.height / 2 - stage.top) / stage.height) * 100,
      vx: ((r.left + r.width / 2) / window.innerWidth) * 100,
      vy: ((r.top + r.height / 2) / window.innerHeight) * 100,
    });
    setLeaving(key);
    timer.current = window.setTimeout(() => navigate(key), LEAVE_MS);
  };

  const stageStyle = {
    '--ar': layout.aspect,
    '--ox': `${origin.x}%`,
    '--oy': `${origin.y}%`,
  } as CSSProperties;

  const t = layout.title;

  return (
    <main className={`desk-room layout-${layout.name}${leaving ? ` leaving leaving-${leaving}` : ''}`}>
      <div className="desk-surface" aria-hidden="true" style={deskAssets.background ? { backgroundImage: `url(${deskAssets.background})` } : undefined} />
      <div className="desk-light" aria-hidden="true" />

      <div className="stage" ref={stageRef} style={stageStyle}>
        <div className="stage-inner">
          <header
            className={`desk-title align-${t.align}`}
            style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%` } as CSSProperties}
          >
            <h1>
              <span className="title-main">Grayhaven</span>
              <span className="title-rule" aria-hidden="true" />
              <span className="title-sub">Murder Mystery</span>
            </h1>
          </header>

          {(Object.keys(layout.deco) as DecoKey[]).map((k) => {
            const p = layout.deco[k]!;
            const Art = DECO[k];
            return (
              <div
                key={k}
                className={`deco deco-${k}`}
                aria-hidden="true"
                style={{ '--x': `${p.x}%`, '--y': `${p.y}%`, '--w': `${p.w}%`, '--r': `${p.r ?? 0}deg`, zIndex: p.z ?? 1 } as CSSProperties}
              >
                <Art />
              </div>
            );
          })}

          <nav aria-label="메인 메뉴" className="desk-menu">
            {(Object.keys(MENU) as MenuKey[]).map((key) => {
              const m = MENU[key];
              return (
                <DeskObject
                  key={key}
                  id={key}
                  placement={layout.menu[key]}
                  ariaLabel={`${m.en} · ${m.ko}`}
                  description={m.desc}
                  image={deskAssets.objects[key]}
                  label={{ en: m.en, ko: m.ko }}
                  active={leaving === key}
                  dimmed={!!leaving && leaving !== key}
                  onActivate={(el) => activate(key, el)}
                >
                  <m.Art />
                </DeskObject>
              );
            })}
          </nav>
        </div>
      </div>

      <p className="desk-hint">책상 위의 물건을 선택하세요</p>

      {/* per-object transition veils */}
      {leaving && <div className={`veil veil-${leaving}`} aria-hidden="true" style={{ '--vx': `${origin.vx}%`, '--vy': `${origin.vy}%` } as CSSProperties} />}
      {leaving === 'gallery' && (
        <div className="veil-photos" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ '--i': i } as CSSProperties} />)}
        </div>
      )}
    </main>
  );
}
