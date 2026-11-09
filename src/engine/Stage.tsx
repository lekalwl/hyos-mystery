import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Step, StageChar } from './script';
import { assetUrl, getContent } from '../content/store';
import { defaultOutfit, findSprite } from '../content/sprites';
import { knownTop, measureTop } from '../lib/imageTop';

/**
 * Renders one Step: background, sprites (with their animations), item,
 * illustration, narration panels and screen effects.
 * The dialogue box itself is passed in as `box` so the player and the
 * editor preview can each supply their own.
 */
interface Props {
  step: Step;
  /** changes every time a new step is shown, to restart one-shot animations */
  stepKey: string | number;
  visibleText: string;
  hiddenText: string;
  box?: ReactNode;
  onClick?: () => void;
}

export function Stage({ step, stepKey, visibleText, hiddenText, box, onClick }: Props) {
  const bgUrl = assetUrl(step.bg);
  const cgUrl = assetUrl(step.cg);
  const itemUrl = assetUrl(step.item);
  const narr = step.narr;
  const dimScene = narr === 'panel' || narr === 'emphasis';
  const hideScene = narr === 'blackpanel' || step.blackout;
  // The scene stays mounted between lines (no flicker); a screen shake is
  // replayed on the same element with the Web Animations API.
  const shakeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!step.fx.includes('shake') || !shakeRef.current?.animate) return;
    shakeRef.current.animate(
      [{ transform: 'none' }, { transform: 'translate(-1.2%, .6%)' }, { transform: 'translate(1.2%, -.6%)' },
       { transform: 'translate(-1.2%, .6%)' }, { transform: 'translate(1.2%, -.6%)' }, { transform: 'none' }],
      { duration: 500, easing: 'linear' },
    );
  }, [stepKey, step.fx]);

  return (
    <div className="stage-root" onClick={onClick}>
      <div ref={shakeRef} className="stage-shake">
        <Background url={bgUrl} transition={step.bgTransition} />

        <div className={`vn-sprites${step.item ? ' has-item' : ''}`}>
          {step.chars.map((c) => (
            <Sprite key={c.id + (c.exit ? '-out' : '')} c={c} stepKey={stepKey} quiet={!!step.speaker?.charId && !c.speaking && !c.exit} />
          ))}
        </div>

        {itemUrl && (
          <figure className="vn-item" key={step.item}>
            <img src={itemUrl} alt="" />
          </figure>
        )}

        {cgUrl && <img key={step.cg} className="vn-cg" src={cgUrl} alt="" />}

        <div className={`vn-dim${dimScene ? ' is-on' : ''}`} aria-hidden="true" />
        <div className={`vn-black${hideScene ? ' is-on' : ''}`} aria-hidden="true" />
      </div>

      {step.fx.includes('flash') && <div key={`fl-${stepKey}`} className="vn-flash" aria-hidden="true" />}
      {step.fx.includes('redflash') && <div key={`rf-${stepKey}`} className="vn-flash is-red" aria-hidden="true" />}

      {narr === 'panel' || narr === 'blackpanel' ? (
        <div key={`p-${stepKey}`} className={`vn-panel${narr === 'blackpanel' ? ' on-black' : ''}`} aria-live="polite">
          <p>{visibleText}<span className="vn-ghost">{hiddenText}</span></p>
        </div>
      ) : narr === 'caption' ? (
        <div key={`c-${stepKey}`} className="vn-caption" aria-live="polite">
          <p>{visibleText}<span className="vn-ghost">{hiddenText}</span></p>
        </div>
      ) : narr === 'emphasis' ? (
        <div key={`e-${stepKey}`} className="vn-emphasis" aria-live="polite">
          <p>{visibleText}<span className="vn-ghost">{hiddenText}</span></p>
        </div>
      ) : (
        box
      )}
    </div>
  );
}

function Background({ url, transition }: { url: string | null; transition: Step['bgTransition'] }) {
  // keep the previous image underneath while the new one fades in
  const [layers, setLayers] = useState<{ url: string; id: number }[]>(url ? [{ url, id: 0 }] : []);
  const n = useRef(0);
  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.url === url) return prev;
      if (!url) return [];
      n.current += 1;
      return [...prev.slice(-1), { url, id: n.current }];
    });
  }, [url]);
  return (
    <div className="vn-bg-wrap">
      {layers.map((l, i) => (
        <img
          key={l.id}
          className={`vn-bg${i === layers.length - 1 && layers.length > 1 ? ` bg-in-${transition}` : ''}`}
          src={l.url}
          alt=""
        />
      ))}
    </div>
  );
}

/** Restart a CSS animation class on an element without remounting it. */
function useReplayClass(ref: React.RefObject<HTMLElement>, base: string, cls: string, key: string | number) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.className = base;
    if (cls) {
      void el.offsetWidth; // reflow so the same animation can play again
      el.classList.add(...cls.split(' ').filter(Boolean));
    }
  }, [key, cls, base, ref]);
}

function Sprite({ c, stepKey, quiet }: { c: StageChar; stepKey: string | number; quiet: boolean }) {
  const url = assetUrl(c.sprite);
  const [prev, setPrev] = useState<string | null>(null);
  const cur = useRef(url);
  const motionRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (cur.current !== url) {
      setPrev(cur.current);
      cur.current = url;
      const t = window.setTimeout(() => setPrev(null), 260);
      return () => window.clearTimeout(t);
    }
  }, [url]);

  const motion = c.exit ? `out-${c.exit}` : c.enter ? `in-${c.enter}` : '';
  useReplayClass(motionRef, 'vn-char-motion', motion, stepKey);
  useReplayClass(animRef, 'vn-char-anim', c.anim ? `anim-${c.anim}` : '', stepKey);

  // characters right of centre face left (mirror), unless turned off per character
  const def = getContent().data.characters.find((x) => x.id === c.id);
  const flip = c.x > 55 && !def?.noFlip;

  // Short characters are raised so at least the upper body clears the
  // dialogue box. Based on the character's default sprite, so the figure
  // doesn't jump when the expression changes.
  const baseUrl = (() => {
    if (!def) return null;
    const a = findSprite(getContent().data.assets, def.id, defaultOutfit(def, getContent().data.assets), '기본').asset;
    return a ? assetUrl(a.id) : null;
  })();
  const [top, setTop] = useState<number | undefined>(() => knownTop(baseUrl));
  useEffect(() => {
    if (!baseUrl) return;
    let alive = true;
    measureTop(baseUrl).then((t) => { if (alive) setTop(t); });
    return () => { alive = false; };
  }, [baseUrl]);
  const SPRITE_H = 92;   // % of stage height (see .vn-char)
  const HEAD_LINE = 24;  // the head should start no lower than this (% from top)
  const autoLift = Math.max(0, (100 - SPRITE_H) + (top ?? 0) * SPRITE_H - HEAD_LINE);
  const lift = def?.stageLift ?? autoLift;

  return (
    <div
      className={`vn-char${quiet ? ' is-quiet' : ''}${c.speaking ? ' is-speaking' : ''}${flip ? ' is-flipped' : ''}`}
      style={{ '--x': `${c.x}%`, '--lift': `${lift}cqh` } as CSSProperties}
    >
      <div ref={motionRef} className="vn-char-motion">
        <div ref={animRef} className="vn-char-anim">
          {prev && <img className="vn-sprite-img is-prev" src={prev} alt="" />}
          {url && <img className={`vn-sprite-img${prev ? ' is-next' : ''}`} src={url} alt="" />}
        </div>
      </div>
    </div>
  );
}
