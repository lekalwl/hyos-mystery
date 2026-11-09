/**
 * Renders a note to a PNG that looks like a sheet from the case notebook.
 * Returns a data URL; the caller decides whether to download or preview it.
 */
export async function renderMemoPng(opts: { episodeLabel: string; text: string; savedAt: number }): Promise<string> {
  try { await document.fonts?.ready; } catch { /* ignore */ }
  const W = 1200, PAD = 96, LINE = 52, FONT = 38;
  const body = `${FONT}px 'Nanum Pen Script', 'Nanum Myeongjo', serif`;

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = body;
  const maxW = W - PAD * 2;
  const lines: string[] = [];
  for (const para of opts.text.replace(/\r/g, '').split('\n')) {
    if (!para) { lines.push(''); continue; }
    let cur = '';
    for (const ch of Array.from(para)) {
      if (measure.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch.trimStart(); }
      else cur += ch;
    }
    lines.push(cur);
  }

  const headH = 230;
  const H = Math.max(900, headH + lines.length * LINE + 140);
  const scale = 2;
  const c = document.createElement('canvas');
  c.width = W * scale; c.height = H * scale;
  const g = c.getContext('2d')!;
  g.scale(scale, scale);

  // paper
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#e2cba3'); grad.addColorStop(1, '#d2b688');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // speckle
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(90,60,30,${Math.random() * 0.07})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }
  // edge burn
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,55,20,.35)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  // margin rule
  g.strokeStyle = 'rgba(140,40,36,.45)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(PAD - 26, headH - 20); g.lineTo(PAD - 26, H - 60); g.stroke();

  // header
  g.fillStyle = '#4a2024';
  g.font = `600 22px 'Cormorant SC', 'Cormorant Garamond', serif`;
  g.fillText('G R A Y H A V E N   ·   C A S E   N O T E S', PAD, 90);
  g.fillStyle = '#2b1d10';
  g.font = `700 40px 'Nanum Myeongjo', serif`;
  g.fillText(opts.episodeLabel, PAD, 148);
  g.fillStyle = 'rgba(43,29,16,.6)';
  g.font = `20px 'Courier New', monospace`;
  const d = new Date(opts.savedAt);
  g.fillText(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`, PAD, 184);
  g.strokeStyle = 'rgba(43,29,16,.55)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(PAD, 204); g.lineTo(W - PAD, 204); g.stroke();

  // ruled lines + text
  g.font = body;
  g.textBaseline = 'alphabetic';
  const total = Math.floor((H - headH - 60) / LINE);
  for (let i = 0; i < total; i++) {
    const y = headH + 20 + i * LINE;
    g.strokeStyle = 'rgba(70,90,120,.22)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(PAD - 40, y + 12); g.lineTo(W - PAD + 40, y + 12); g.stroke();
    if (lines[i] !== undefined) { g.fillStyle = '#2a1d12'; g.fillText(lines[i], PAD, y); }
  }
  return c.toDataURL('image/png');
}
