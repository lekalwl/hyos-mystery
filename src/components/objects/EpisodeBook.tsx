/**
 * The large leather case-book. Two layers so the cover can swing open:
 *  - .book-base : back board, page block and the first page (seen when opened)
 *  - .book-cover: the front board, hinged at the spine
 * Drawn in a slightly oblique view (lower edge wider than the top).
 */
export function EpisodeBook() {
  return (
    <div className="obj-art book-art">
      <svg className="book-base" viewBox="0 0 560 440" aria-hidden="true">
        <defs>
          <linearGradient id="bk-pages" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e3cfa6" />
            <stop offset="1" stopColor="#a88a5f" />
          </linearGradient>
          <linearGradient id="bk-page" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dcc49a" />
            <stop offset="1" stopColor="#c4a776" />
          </linearGradient>
        </defs>
        {/* back board */}
        <path d="M30 34 L520 16 L548 386 L44 418 Z" fill="#24120f" />
        {/* page block: bottom edge + right edge */}
        <path d="M46 386 L530 356 L534 378 L50 410 Z" fill="url(#bk-pages)" />
        <path d="M512 22 L530 356 L534 378 L518 40 Z" fill="#b89a6a" />
        <g stroke="#7d6544" strokeOpacity=".45" strokeWidth=".8">
          <path d="M48 392 L531 362" /><path d="M49 398 L532 368" /><path d="M49 404 L533 373" />
        </g>
        {/* first page (revealed when the cover opens) */}
        <path d="M46 34 L512 18 L530 356 L58 386 Z" fill="url(#bk-page)" />
        <g fill="none" stroke="#6b5235" strokeOpacity=".55">
          <path d="M150 80 L420 71" strokeWidth="1.2" />
          <path d="M210 104 L360 99" strokeWidth=".8" />
        </g>
        <g stroke="#6b5235" strokeOpacity=".28" strokeWidth="2.2" strokeLinecap="round">
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M${120 + i * 0.9} ${150 + i * 22} L${430 + i * 1.1} ${140 + i * 21}`} />
          ))}
        </g>
      </svg>

      <div className="book-cover">
        <svg viewBox="0 0 560 440" aria-hidden="true">
          <defs>
            <linearGradient id="bk-leather" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5a2a27" />
              <stop offset=".55" stopColor="#3f1c1c" />
              <stop offset="1" stopColor="#2a1311" />
            </linearGradient>
            <radialGradient id="bk-sheen" cx=".42" cy=".38" r=".7">
              <stop offset="0" stopColor="#f3d9a8" stopOpacity=".16" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bk-spine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1a0b0a" />
              <stop offset=".6" stopColor="#4a2321" />
              <stop offset="1" stopColor="#2c1412" />
            </linearGradient>
            <linearGradient id="bk-brass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e2c58e" />
              <stop offset=".5" stopColor="#a8854d" />
              <stop offset="1" stopColor="#6e532b" />
            </linearGradient>
            <filter id="bk-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>

          {/* cover board */}
          <path className="cover-shape" d="M24 26 L516 8 L546 376 L40 410 Z" fill="url(#bk-leather)" />
          <path d="M24 26 L516 8 L546 376 L40 410 Z" fill="#000" filter="url(#bk-grain)" opacity=".5" />
          <path d="M24 26 L516 8 L546 376 L40 410 Z" fill="url(#bk-sheen)" />
          {/* raised spine bands */}
          <path d="M24 26 L70 24 L84 406 L40 410 Z" fill="url(#bk-spine)" />
          <g stroke="#8a6a3c" strokeOpacity=".7" strokeWidth="2">
            <path d="M28 96 L74 94" /><path d="M31 176 L77 174" /><path d="M34 256 L80 254" /><path d="M37 336 L83 334" />
          </g>

          {/* blind + gilt frame */}
          <path d="M104 50 L490 36 L514 356 L116 382 Z" fill="none" stroke="#1d0c0b" strokeOpacity=".6" strokeWidth="5" />
          <path className="gilt" d="M104 50 L490 36 L514 356 L116 382 Z" fill="none" stroke="#b99860" strokeWidth="1.6" />
          <path className="gilt" d="M118 64 L476 51 L498 342 L129 366 Z" fill="none" stroke="#b99860" strokeWidth=".9" strokeOpacity=".75" />

          {/* filigree corners of the frame */}
          <g className="gilt" fill="none" stroke="#b99860" strokeWidth="1.1" strokeOpacity=".9">
            <path d="M118 64 q28 4 30 30 M118 64 q4 26 30 30" />
            <path d="M476 51 q-28 5 -29 31 M476 51 q-3 27 -29 31" />
            <path d="M498 342 q-28 -3 -31 -29 M498 342 q-2 -27 -31 -29" />
            <path d="M129 366 q28 -2 30 -29 M129 366 q2 -28 30 -29" />
          </g>

          {/* central emblem: an eye of the investigator within a lozenge */}
          <g className="gilt" transform="translate(308 162) rotate(-2.4)" fill="none" stroke="#c9a96f">
            <path d="M0 -58 L44 0 L0 58 L-44 0 Z" strokeWidth="1.4" />
            <path d="M0 -46 L34 0 L0 46 L-34 0 Z" strokeWidth=".7" strokeOpacity=".7" />
            <path d="M-26 0 Q0 -20 26 0 Q0 20 -26 0 Z" strokeWidth="1.3" />
            <circle r="7.5" strokeWidth="1.2" />
            <circle r="2.6" fill="#c9a96f" stroke="none" />
            <path d="M-70 0 h18 M52 0 h18 M0 -76 v12 M0 64 v12" strokeWidth=".9" strokeOpacity=".7" />
          </g>

          {/* brass corner protectors */}
          <path d="M516 8 L546 376 L512 378 L506 340 Z" opacity="0" />
          <g fill="url(#bk-brass)" stroke="#4b3618" strokeWidth=".8">
            <path d="M516 8 L476 9.5 L478 16 L510 15 L512 44 L519 46 Z" />
            <path d="M546 376 L543 336 L536 338 L538 368 L506 370 L506 378 Z" />
          </g>
          {/* worn edges */}
          <path d="M24 26 L516 8 L546 376 L40 410 Z" fill="none" stroke="#120706" strokeWidth="3" strokeOpacity=".8" />
          <path d="M70 24 L516 8" stroke="#a37c56" strokeOpacity=".28" strokeWidth="1.5" />

          {/* hover rim (fades in) */}
          <path className="rim" d="M24 26 L516 8 L546 376 L40 410 Z" fill="none" stroke="#d8bc83" strokeWidth="2" />
        </svg>
        <span className="obj-label book-label">
          <span className="label-en">Episodes</span>
          <span className="label-ko">에피소드</span>
        </span>
      </div>
    </div>
  );
}
