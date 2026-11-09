/**
 * Photo album: a cloth-and-leather album with a brass title plate.
 * Faded photographs stick out from beneath the cover.
 */
export function GalleryAlbum() {
  return (
    <div className="obj-art album-art">
      <svg className="album-base" viewBox="0 0 520 380" aria-hidden="true">
        <defs>
          <linearGradient id="al-photo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9b28b" />
            <stop offset="1" stopColor="#8e7656" />
          </linearGradient>
        </defs>
        {/* loose photographs peeking out */}
        <g transform="rotate(-11 120 60)">
          <rect x="60" y="10" width="150" height="110" fill="#e6d9bf" />
          <rect x="68" y="18" width="134" height="86" fill="url(#al-photo)" />
          <path d="M68 104 L68 76 L100 70 L100 52 L116 44 L132 52 L132 66 L170 60 L202 74 L202 104 Z" fill="#5d4a35" opacity=".7" />
        </g>
        <g transform="rotate(14 430 300)">
          <rect x="380" y="250" width="120" height="100" fill="#e2d4b8" />
          <rect x="388" y="258" width="104" height="76" fill="url(#al-photo)" opacity=".9" />
          <circle cx="440" cy="290" r="15" fill="#5d4a35" opacity=".6" />
          <path d="M412 334 c4 -22 16 -28 28 -28 s24 6 28 28 z" fill="#5d4a35" opacity=".6" />
        </g>
        {/* page block */}
        <path d="M26 46 L486 40 L494 352 L22 360 Z" fill="#1d1410" />
        <path d="M30 352 L492 344 L494 360 L30 370 Z" fill="#cdb48a" />
        <g stroke="#6f5638" strokeOpacity=".5"><path d="M30 357 L493 349" /><path d="M30 363 L494 355" /></g>
        {/* inside page */}
        <path d="M34 50 L478 44 L486 340 L32 348 Z" fill="#2a211a" />
        <rect x="90" y="100" width="150" height="110" fill="#d9c9a8" opacity=".85" transform="rotate(-2 165 155)" />
        <rect x="270" y="150" width="160" height="120" fill="#d9c9a8" opacity=".85" transform="rotate(3 350 210)" />
      </svg>
      <div className="album-cover">
        <svg viewBox="0 0 520 380" aria-hidden="true">
          <defs>
            <linearGradient id="al-cloth" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3d3226" />
              <stop offset="1" stopColor="#211912" />
            </linearGradient>
            <linearGradient id="al-leather" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1e120c" />
              <stop offset=".5" stopColor="#4a2f20" />
              <stop offset="1" stopColor="#2a1a12" />
            </linearGradient>
            <linearGradient id="al-plate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d9bc84" />
              <stop offset=".5" stopColor="#a5824a" />
              <stop offset="1" stopColor="#7a5c30" />
            </linearGradient>
            <pattern id="al-weave" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-1)">
              <path d="M0 3 H6 M3 0 V6" stroke="#000" strokeOpacity=".18" strokeWidth="1" />
            </pattern>
          </defs>
          <path className="cover-shape" d="M20 38 L490 30 L500 340 L16 350 Z" fill="url(#al-cloth)" />
          <path d="M20 38 L490 30 L500 340 L16 350 Z" fill="url(#al-weave)" />
          {/* leather spine + corners */}
          <path d="M20 38 L96 37 L94 349 L16 350 Z" fill="url(#al-leather)" />
          <path d="M490 30 L430 31 L490 92 Z" fill="#3a2418" />
          <path d="M500 340 L497 280 L440 342 Z" fill="#3a2418" />
          <g stroke="#8a6a3c" strokeOpacity=".55" strokeWidth="1.2" fill="none">
            <path d="M96 37 L94 349" />
            <path d="M430 31 L490 92" /><path d="M497 280 L440 342" />
          </g>
          {/* tooled border */}
          <path d="M120 64 L466 58 L472 314 L118 322 Z" fill="none" stroke="#8a6f45" strokeOpacity=".55" strokeWidth="1" strokeDasharray="1 4" />
          {/* title plate */}
          <g>
            <path d="M200 150 L398 147 L400 222 L200 226 Z" fill="#160f0a" opacity=".5" transform="translate(3 4)" />
            <path className="plate" d="M200 150 L398 147 L400 222 L200 226 Z" fill="url(#al-plate)" stroke="#4b3618" />
            <path d="M208 157 L390 154 L392 215 L208 219 Z" fill="none" stroke="#5a4220" strokeOpacity=".6" />
            {[[204, 154], [394, 151], [396, 218], [204, 222]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.2" fill="#3a2a12" />
            ))}
          </g>
          <path className="rim" d="M20 38 L490 30 L500 340 L16 350 Z" fill="none" stroke="#d8bc83" strokeWidth="2" />
        </svg>
        <span className="obj-label plate-label album-label">
          <span className="label-en">Gallery</span>
          <span className="label-ko">갤러리</span>
        </span>
      </div>
    </div>
  );
}
