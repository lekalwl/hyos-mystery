/**
 * Brass portrait locket lying on the desk with its chain trailing off-desk.
 * Layers: chain, case (frame + interior portrait), hinged lid.
 * Seen from slightly above, so the round case is drawn as an ellipse.
 */
const brass = (
  <>
    <radialGradient id="lk-brass" cx=".35" cy=".3" r=".8">
      <stop offset="0" stopColor="#f0d79e" />
      <stop offset=".35" stopColor="#c19e60" />
      <stop offset=".75" stopColor="#7a5a2e" />
      <stop offset="1" stopColor="#4a3317" />
    </radialGradient>
    <linearGradient id="lk-ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#5a4020" />
      <stop offset=".5" stopColor="#e0c286" />
      <stop offset="1" stopColor="#5a4020" />
    </linearGradient>
  </>
);

export function ProfileLocket() {
  // Chain: interlocking links sampled at even spacing along a curve that
  // starts at the bale ring and drapes off the desk to the upper-left.
  const P = [[150, 6], [128, -70], [10, -60], [-60, -150], [-110, -230], [-170, -330]];
  const bez = (t: number) => {
    // Catmull-Rom through P
    const n = P.length - 1;
    const seg = Math.min(n - 1, Math.floor(t * n));
    const u = t * n - seg;
    const p0 = P[Math.max(0, seg - 1)], p1 = P[seg], p2 = P[seg + 1], p3 = P[Math.min(n, seg + 2)];
    const f = (i: number) =>
      0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u * u + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u * u * u);
    return [f(0), f(1)];
  };
  const pts: number[][] = [];
  let last = bez(0);
  pts.push(last);
  for (let t = 0; t <= 1; t += 0.0005) {
    const q = bez(t);
    if (Math.hypot(q[0] - last[0], q[1] - last[1]) >= 11) { pts.push(q); last = q; }
  }
  const links = pts.slice(0, -1).map((pt, i) => {
    const nx = pts[i + 1];
    const ang = (Math.atan2(nx[1] - pt[1], nx[0] - pt[0]) * 180) / Math.PI;
    const cx = (pt[0] + nx[0]) / 2, cy = (pt[1] + nx[1]) / 2;
    // alternate links: flat (open oval) and edge-on (thin bar)
    return i % 2 === 0
      ? <ellipse key={i} cx={cx} cy={cy} rx="9" ry="4.6" transform={`rotate(${ang} ${cx} ${cy})`} />
      : <ellipse key={i} cx={cx} cy={cy} rx="9" ry="1.3" transform={`rotate(${ang} ${cx} ${cy})`} className="edge" />;
  });

  return (
    <div className="obj-art locket-art">
      <svg className="locket-chain" viewBox="-300 -330 600 630" aria-hidden="true">
        <defs>{brass}</defs>
        <g fill="none" stroke="#1a0f05" strokeWidth="4" opacity=".5" transform="translate(5 8)">{links}</g>
        <g fill="none" stroke="#5a4020" strokeWidth="3.6">{links}</g>
        <g fill="none" stroke="#d6b77a" strokeWidth="1.6">{links}</g>
      </svg>

      <svg className="locket-case" viewBox="0 0 300 300" aria-hidden="true">
        <defs>
          {brass}
          <radialGradient id="lk-velvet" cx=".5" cy=".4" r=".7">
            <stop offset="0" stopColor="#5c262b" />
            <stop offset="1" stopColor="#1e0b0d" />
          </radialGradient>
        </defs>
        {/* side thickness */}
        <ellipse cx="150" cy="166" rx="128" ry="116" fill="#3a2812" />
        <ellipse cx="150" cy="158" rx="128" ry="116" fill="url(#lk-brass)" />
        {/* interior (visible when lid opens) */}
        <ellipse cx="150" cy="158" rx="106" ry="95" fill="url(#lk-velvet)" />
        <ellipse cx="150" cy="158" rx="92" ry="82" fill="#d9c39b" opacity=".92" />
        <g fill="#5b4632" opacity=".55">
          <circle cx="150" cy="138" r="26" />
          <path d="M92 230 C96 186 122 172 150 172 C178 172 204 186 208 230 Z" />
        </g>
        <ellipse cx="150" cy="158" rx="92" ry="82" fill="none" stroke="#7a5a2e" strokeWidth="3" />
        {/* bale */}
        <rect x="138" y="22" width="24" height="26" rx="8" fill="url(#lk-brass)" stroke="#4a3317" />
        <ellipse cx="150" cy="18" rx="13" ry="10" fill="none" stroke="url(#lk-ring)" strokeWidth="5" />
      </svg>

      <div className="locket-lid">
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <defs>
            {brass}
            <radialGradient id="lk-enamel" cx=".42" cy=".36" r=".75">
              <stop offset="0" stopColor="#6a2a2f" />
              <stop offset=".7" stopColor="#3a1518" />
              <stop offset="1" stopColor="#1f0a0c" />
            </radialGradient>
          </defs>
          <ellipse cx="150" cy="158" rx="122" ry="110" fill="url(#lk-brass)" />
          {/* bead ring */}
          <g fill="#e6cb92" opacity=".85">
            {Array.from({ length: 48 }).map((_, i) => {
              const a = (i / 48) * Math.PI * 2;
              return <circle key={i} cx={150 + Math.cos(a) * 111} cy={158 + Math.sin(a) * 100} r="2.3" />;
            })}
          </g>
          <ellipse cx="150" cy="158" rx="98" ry="88" fill="url(#lk-enamel)" stroke="#2e1f0c" strokeWidth="3" />
          {/* engraved crest: keyhole within a wreath */}
          <g transform="translate(150 132) scale(.62) translate(-150 -150)">
          <g className="gilt" fill="none" stroke="#c9a96f" strokeWidth="2" strokeLinecap="round">
            <path d="M150 92 c-34 6 -54 36 -50 70 c3 22 16 38 34 46" />
            <path d="M150 92 c34 6 54 36 50 70 c-3 22 -16 38 -34 46" />
            {Array.from({ length: 7 }).map((_, i) => {
              const t = 0.18 + i * 0.1;
              const ang = Math.PI * (0.62 + t * 0.9);
              const x = Math.cos(ang) * 52, y = Math.sin(ang) * 58;
              return (
                <g key={i}>
                  <ellipse cx={150 + x} cy={150 - y * 0.2 + i * 9} rx="3.2" ry="6.5" transform={`rotate(${-30 + i * 14} ${150 + x} ${150 - y * 0.2 + i * 9})`} />
                  <ellipse cx={150 - x} cy={150 - y * 0.2 + i * 9} rx="3.2" ry="6.5" transform={`rotate(${30 - i * 14} ${150 - x} ${150 - y * 0.2 + i * 9})`} />
                </g>
              );
            })}
          </g>
          <path d="M150 128 a15 15 0 0 1 8 27 l7 33 h-30 l7 -33 a15 15 0 0 1 8 -27 z" fill="#c9a96f" className="gilt-fill" />
          <path d="M150 136 a7 7 0 0 1 3.5 13 l3.5 25 h-14 l3.5 -25 a7 7 0 0 1 3.5 -13 z" fill="#2a0e10" />
          </g>
          {/* engraved hairline under the label */}
          <path d="M104 226 Q150 236 196 226" fill="none" stroke="#c9a96f" strokeOpacity=".55" strokeWidth="1" />
          {/* specular */}
          <path d="M70 110 C86 74 124 56 160 54" fill="none" stroke="#fff3d6" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" />
          <ellipse className="rim" cx="150" cy="158" rx="124" ry="112" fill="none" stroke="#d8bc83" strokeWidth="2.4" />
        </svg>
        <span className="obj-label engraved-label locket-label">
          <span className="label-en">Profiles</span>
          <span className="label-ko">인물</span>
        </span>
      </div>
    </div>
  );
}
