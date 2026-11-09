/**
 * Non-interactive desk props. They sit a step darker and less saturated
 * than the four menu objects so the eye goes to the menu first.
 */
export function Candle() {
  return (
    <svg viewBox="0 0 200 260" aria-hidden="true">
      <defs>
        <radialGradient id="cd-dish" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#d1b27a" /><stop offset=".6" stopColor="#7a5a2e" /><stop offset="1" stopColor="#3a2812" />
        </radialGradient>
        <linearGradient id="cd-wax" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9b48f" /><stop offset=".45" stopColor="#f1e4c6" /><stop offset="1" stopColor="#a8916b" />
        </linearGradient>
        <radialGradient id="cd-flame" cx=".5" cy=".7" r=".6">
          <stop offset="0" stopColor="#fff6dc" /><stop offset=".45" stopColor="#ffcf7a" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="222" rx="92" ry="32" fill="#3a2812" />
      <ellipse cx="100" cy="214" rx="92" ry="32" fill="url(#cd-dish)" />
      <ellipse cx="100" cy="212" rx="64" ry="21" fill="#4d391c" />
      <path d="M180 214 q18 -4 16 12 q-2 12 -18 6" fill="none" stroke="#8d6b38" strokeWidth="6" />
      <path d="M72 210 V96 q0 -8 28 -8 q28 0 28 8 V210 q-28 10 -56 0 z" fill="url(#cd-wax)" />
      <path d="M118 100 q6 26 2 46 q-4 10 4 22" fill="none" stroke="#f5ead2" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <ellipse cx="100" cy="96" rx="28" ry="8" fill="#e8d9b8" />
      <path d="M100 96 v-10" stroke="#2a1a0e" strokeWidth="2.4" />
      <g className="flame">
        <ellipse cx="100" cy="66" rx="26" ry="40" fill="url(#cd-flame)" opacity=".55" />
        <path d="M100 30 C112 52 114 72 100 88 C86 72 88 52 100 30 Z" fill="url(#cd-flame)" />
        <path d="M100 58 C105 68 105 78 100 86 C95 78 95 68 100 58 Z" fill="#fffaf0" opacity=".9" />
      </g>
    </svg>
  );
}

export function Inkwell() {
  return (
    <svg viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <linearGradient id="ik-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0d0a0c" /><stop offset=".35" stopColor="#2c2430" /><stop offset=".55" stopColor="#0d0a0c" /><stop offset="1" stopColor="#1b1519" />
        </linearGradient>
        <linearGradient id="ik-quill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8cdb8" /><stop offset="1" stopColor="#6e6250" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="196" rx="64" ry="18" fill="#000" opacity=".45" />
      <path d="M24 120 q0 -26 56 -26 q56 0 56 26 v56 q0 18 -56 18 q-56 0 -56 -18 z" fill="url(#ik-glass)" />
      <path d="M38 126 v44" stroke="#c9b9a0" strokeOpacity=".25" strokeWidth="5" strokeLinecap="round" />
      <rect x="56" y="80" width="48" height="22" rx="4" fill="#8a6a3c" />
      <ellipse cx="80" cy="80" rx="24" ry="6" fill="#0a0708" />
      {/* quill */}
      <path d="M78 82 L196 6" stroke="#3a3128" strokeWidth="2.4" />
      <path d="M120 54 C140 22 176 6 210 2 C196 20 176 40 150 50 C140 54 128 56 120 54 Z" fill="url(#ik-quill)" opacity=".85" />
      <path d="M124 52 L204 4" stroke="#f1e8d6" strokeOpacity=".5" strokeWidth="1" />
    </svg>
  );
}

export function Magnifier() {
  // Reading glass lying flat: round lens in a turned brass rim, long
  // wooden handle running off toward the lower right. The glass is clear,
  // so the desk shows through it.
  return (
    <svg viewBox="0 0 300 220" aria-hidden="true">
      <defs>
        <radialGradient id="mg-glass" cx=".38" cy=".32" r=".75">
          <stop offset="0" stopColor="#fff8e8" stopOpacity=".22" />
          <stop offset=".55" stopColor="#e9dcc0" stopOpacity=".06" />
          <stop offset="1" stopColor="#120a05" stopOpacity=".28" />
        </radialGradient>
        <linearGradient id="mg-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0d59a" />
          <stop offset=".45" stopColor="#a8854d" />
          <stop offset="1" stopColor="#5a4020" />
        </linearGradient>
        <linearGradient id="mg-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4a2c" />
          <stop offset=".35" stopColor="#a0663c" />
          <stop offset="1" stopColor="#2e180c" />
        </linearGradient>
      </defs>
      {/* contact shadows */}
      <ellipse cx="96" cy="100" rx="78" ry="68" fill="#000" opacity=".32" transform="translate(7 11)" />
      <path d="M150 140 L292 214" stroke="#000" strokeOpacity=".35" strokeWidth="20" strokeLinecap="round" transform="translate(5 9)" />
      {/* handle: ferrule + turned wood */}
      <g transform="rotate(30 150 140)">
        <rect x="150" y="131" width="26" height="18" rx="3" fill="url(#mg-rim)" stroke="#4a3317" strokeWidth=".8" />
        <path d="M176 132 h8 q6 -5 12 0 h82 q16 8 0 16 h-82 q-6 5 -12 0 h-8 z" fill="url(#mg-wood)" transform="translate(0 -1)" />
        <path d="M200 135 h76" stroke="#d9a878" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" />
        <circle cx="285" cy="140" r="5" fill="url(#mg-rim)" />
      </g>
      {/* lens */}
      <circle cx="94" cy="92" r="70" fill="url(#mg-glass)" />
      <circle cx="94" cy="92" r="70" fill="none" stroke="url(#mg-rim)" strokeWidth="11" />
      <circle cx="94" cy="92" r="75.5" fill="none" stroke="#3a2812" strokeWidth="1.2" />
      <circle cx="94" cy="92" r="64.5" fill="none" stroke="#3a2812" strokeOpacity=".7" strokeWidth="1" />
      {/* reflections on the glass */}
      <path d="M48 70 A52 52 0 0 1 94 40" fill="none" stroke="#fffaf0" strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
      <path d="M52 84 A46 46 0 0 1 60 66" fill="none" stroke="#fffaf0" strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" />
      <path d="M128 140 A52 52 0 0 0 146 112" fill="none" stroke="#fffaf0" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LetterOpener() {
  return (
    <svg viewBox="0 0 360 80" aria-hidden="true">
      <defs>
        <linearGradient id="lo-blade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9d3c6" /><stop offset=".5" stopColor="#8d877b" /><stop offset="1" stopColor="#4a463f" />
        </linearGradient>
      </defs>
      <path d="M120 46 L350 40 L120 34 Z" fill="#000" opacity=".4" transform="translate(4 8)" />
      <path d="M118 46 L352 40 L118 32 Z" fill="url(#lo-blade)" />
      <rect x="102" y="24" width="14" height="32" rx="3" fill="#8f6d3a" />
      <path d="M10 34 q40 -10 92 0 v12 q-52 10 -92 0 q-8 -6 0 -12 z" fill="#3a2218" stroke="#8f6d3a" strokeWidth="2" />
      <circle cx="12" cy="40" r="8" fill="#a8854d" />
    </svg>
  );
}

export function Papers() {
  return (
    <svg viewBox="0 0 420 320" aria-hidden="true">
      <defs>
        <linearGradient id="pp-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8b089" /><stop offset="1" stopColor="#9a8160" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 210 160)">
        <rect x="40" y="40" width="300" height="230" fill="#000" opacity=".3" transform="translate(6 8)" />
        <rect x="40" y="40" width="300" height="230" fill="url(#pp-a)" />
        <g stroke="#4a3826" strokeOpacity=".35" strokeWidth="2">
          {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M64 ${84 + i * 20} H${300 - (i % 3) * 30}`} />)}
        </g>
        <text x="64" y="68" fontFamily="'Courier New', monospace" fontSize="13" fill="#3a2a1a" opacity=".6" letterSpacing="2">CASE FILE · NO. ____</text>
      </g>
      <g transform="rotate(9 260 170)">
        <rect x="150" y="70" width="230" height="170" fill="#000" opacity=".3" transform="translate(6 8)" />
        <rect x="150" y="70" width="230" height="170" fill="#d2bd98" />
        <g stroke="#4a3826" strokeOpacity=".3" strokeWidth="1.6">
          {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M170 ${104 + i * 20} H${350 - (i % 2) * 40}`} />)}
        </g>
      </g>
    </svg>
  );
}

export function LoosePhoto() {
  return (
    <svg viewBox="0 0 160 130" aria-hidden="true">
      <rect x="6" y="6" width="148" height="118" fill="#000" opacity=".35" transform="translate(4 6)" />
      <rect x="6" y="6" width="148" height="118" fill="#ddd0b4" />
      <rect x="14" y="14" width="132" height="90" fill="#8d765a" />
      <path d="M14 104 V80 L50 70 L60 50 L74 42 L88 50 L96 66 L146 74 V104 Z" fill="#4e3d2c" opacity=".7" />
    </svg>
  );
}
