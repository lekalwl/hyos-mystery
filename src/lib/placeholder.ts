/**
 * Generates clearly-marked placeholder art as SVG data URIs.
 * Every placeholder carries the words "PLACEHOLDER" so it can never be
 * mistaken for final artwork. Replace by pointing `src` at a real file.
 */
type Kind = 'illustration' | 'sprite' | 'background' | 'portrait' | 'thumbnail';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function placeholder(
  w: number,
  h: number,
  label: string,
  kind: Kind = 'illustration',
  hue = 28,
): string {
  const fg = `hsl(${hue} 32% 62%)`;
  const dim = `hsl(${hue} 22% 34%)`;
  const bg1 = `hsl(${hue} 24% 15%)`;
  const bg2 = `hsl(${hue} 30% 8%)`;
  const min = Math.min(w, h);
  const fs = Math.max(12, Math.round(min * 0.065));

  let figure = '';
  if (kind === 'sprite' || kind === 'portrait') {
    // neutral bust silhouette
    const cx = w / 2;
    const headR = kind === 'sprite' ? w * 0.13 : w * 0.17;
    const headY = kind === 'sprite' ? h * 0.2 : h * 0.4;
    figure = `
      <circle cx="${cx}" cy="${headY}" r="${headR}" fill="${dim}" opacity=".75"/>
      <path d="M ${cx - w * 0.36} ${h} C ${cx - w * 0.34} ${headY + headR * 1.6}, ${cx - headR * 0.9} ${headY + headR * 1.25}, ${cx} ${headY + headR * 1.25}
               C ${cx + headR * 0.9} ${headY + headR * 1.25}, ${cx + w * 0.34} ${headY + headR * 1.6}, ${cx + w * 0.36} ${h} Z" fill="${dim}" opacity=".75"/>`;
  } else {
    // horizon + frame lines
    figure = `
      <path d="M0 ${h * 0.68} L ${w * 0.28} ${h * 0.52} L ${w * 0.46} ${h * 0.62} L ${w * 0.7} ${h * 0.42} L ${w} ${h * 0.6} L ${w} ${h} L 0 ${h} Z" fill="${dim}" opacity=".45"/>
      <circle cx="${w * 0.76}" cy="${h * 0.24}" r="${min * 0.07}" fill="${dim}" opacity=".6"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
      <pattern id="p" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" stroke="${fg}" stroke-opacity=".06" stroke-width="6"/></pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect width="${w}" height="${h}" fill="url(#p)"/>
    ${figure}
    <rect x="${min * 0.04}" y="${min * 0.04}" width="${w - min * 0.08}" height="${h - min * 0.08}" fill="none" stroke="${fg}" stroke-opacity=".35" stroke-width="${Math.max(1, min * 0.004)}"/>
    <text x="50%" y="${h / 2 - fs * 0.35}" text-anchor="middle" font-family="Georgia, serif" font-size="${fs}" letter-spacing="${fs * 0.18}" fill="${fg}">${esc(label)}</text>
    <text x="50%" y="${h / 2 + fs * 1.05}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(fs * 0.55)}" letter-spacing="${fs * 0.12}" fill="${fg}" fill-opacity=".7">PLACEHOLDER · ${w}×${h}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
