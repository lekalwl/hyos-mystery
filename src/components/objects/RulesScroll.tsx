/**
 * Parchment scroll: a tight roll at the back, part of the sheet unrolled
 * toward the viewer, tied with cord and a wax seal.
 * The sheet is a separate layer so it can unroll on click.
 */
export function RulesScroll() {
  return (
    <div className="obj-art scroll-art">
      <div className="scroll-sheet">
        <svg viewBox="0 0 480 200" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b8996a" />
              <stop offset=".25" stopColor="#d9c095" />
              <stop offset="1" stopColor="#cdb185" />
            </linearGradient>
            <filter id="sc-fiber" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency=".02 .4" numOctaves="3" seed="9" />
              <feColorMatrix values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .35 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <path className="cover-shape" d="M30 10 L456 4 Q470 100 462 196 L22 196 Q14 100 30 10 Z" fill="url(#sc-sheet)" />
          <path d="M30 10 L456 4 Q470 100 462 196 L22 196 Q14 100 30 10 Z" fill="#000" filter="url(#sc-fiber)" />
          <g stroke="#5c4428" strokeOpacity=".35" strokeWidth="2.4" strokeLinecap="round">
            <path d="M120 120 L360 118" /><path d="M100 146 L380 144" /><path d="M110 170 L300 169" />
          </g>
          <path d="M22 196 L462 196" stroke="#8a6c44" strokeWidth="2" />
          <path className="rim" d="M30 10 L456 4 Q470 100 462 196 L22 196 Q14 100 30 10 Z" fill="none" stroke="#d8bc83" strokeWidth="2" />
        </svg>
      </div>
      <svg className="scroll-roll" viewBox="0 0 520 120" aria-hidden="true">
        <defs>
          <linearGradient id="sc-roll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8f7048" />
            <stop offset=".3" stopColor="#e3cda2" />
            <stop offset=".6" stopColor="#c7a878" />
            <stop offset="1" stopColor="#6b5233" />
          </linearGradient>
          <radialGradient id="sc-end" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#5c4428" />
            <stop offset=".3" stopColor="#c9ad7f" />
            <stop offset=".55" stopColor="#8f7048" />
            <stop offset=".75" stopColor="#d6bd90" />
            <stop offset="1" stopColor="#7d6240" />
          </radialGradient>
          <radialGradient id="sc-wax" cx=".4" cy=".35" r=".7">
            <stop offset="0" stopColor="#8a3a3c" />
            <stop offset=".7" stopColor="#5a1f22" />
            <stop offset="1" stopColor="#3a1215" />
          </radialGradient>
        </defs>
        {/* cylinder body: rounded at the far (left) end, open spiral at the near (right) end */}
        <path d="M58 24 H478 V92 H58 C34 92 26 72 26 58 C26 44 34 24 58 24 Z" fill="url(#sc-roll)" />
        <path d="M58 24 C40 24 30 40 30 58" fill="none" stroke="#f0dfbb" strokeOpacity=".5" strokeWidth="2" />
        {/* the loose outer layer wrapping round and becoming the sheet */}
        <path d="M60 92 H476" stroke="#6b5233" strokeOpacity=".55" strokeWidth="1.4" />
        <path d="M58 30 H470" stroke="#fff4dc" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
        {/* near end: rolled paper spiral */}
        <ellipse cx="478" cy="58" rx="17" ry="34" fill="url(#sc-end)" />
        <path d="M478 58 m0 -4 a4 6 0 1 1 -1 10 a8 13 0 1 1 3 -22 a12 20 0 1 1 -5 36 a15 27 0 1 1 7 -50"
              fill="none" stroke="#6b5233" strokeOpacity=".7" strokeWidth="1.2" />
        <ellipse cx="478" cy="58" rx="17" ry="34" fill="none" stroke="#5c4428" strokeWidth="1.2" />
        {/* cord */}
        <g fill="none" stroke="#5a1f22" strokeWidth="4.5" strokeLinecap="round">
          <path d="M300 20 Q296 58 302 96" />
          <path d="M310 20 Q306 58 312 96" stroke="#7a2e30" strokeWidth="3" />
          <path d="M306 94 q-12 22 -36 26" />
          <path d="M306 94 q18 18 40 18" />
        </g>
        <circle cx="306" cy="60" r="20" fill="url(#sc-wax)" />
        <path d="M296 52 l10 -6 l10 6 v10 l-10 6 l-10 -6 z" fill="none" stroke="#c78a7c" strokeOpacity=".5" strokeWidth="1.3" />
        <path className="rim" d="M58 24 H478 a17 34 0 0 1 0 68 H58 C34 92 26 72 26 58 C26 44 34 24 58 24 Z" fill="none" stroke="#d8bc83" strokeWidth="2" />
      </svg>
      <span className="obj-label sheet-label scroll-label">
        <span className="label-en">Rules</span>
        <span className="label-ko">규칙</span>
      </span>
    </div>
  );
}
