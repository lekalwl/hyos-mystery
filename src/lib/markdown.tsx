import type { ReactNode } from 'react';

/**
 * Small markdown renderer for the rules scroll. Builds React elements
 * (never innerHTML), so text from the editor can't inject markup.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? <strong key={`${key}-b${i++}`}>{m[1]}</strong> : <em key={`${key}-i${i++}`}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { t: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'note' | 'end'; text: string }
  | { t: 'hr' }
  | { t: 'list'; items: string[] }
  | { t: 'stats'; items: [string, string][] }
  | { t: 'card'; title: string; body: Block[] };

function parse(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { blocks.push({ t: 'p', text: para.join('\n') }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const s = line.trim();
    if (!s) { flush(); continue; }
    if (s.startsWith(':::')) {
      flush();
      const title = s.slice(3).replace(/^카드\s*/, '').trim();
      const body: string[] = [];
      while (++i < lines.length && lines[i].trim() !== ':::') body.push(lines[i]);
      blocks.push({ t: 'card', title, body: parse(body) });
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(#{1,4})\s+(.*)$/))) {
      flush();
      blocks.push({ t: (['h1', 'h2', 'h3', 'h4'] as const)[m[1].length - 1], text: m[2] });
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(s)) { flush(); blocks.push({ t: 'hr' }); continue; }
    if (s.startsWith('>')) { flush(); blocks.push({ t: 'note', text: s.replace(/^>\s?/, '') }); continue; }
    if (s.startsWith('!!')) { flush(); blocks.push({ t: 'end', text: s.slice(2).trim() }); continue; }
    if (/^(\[\[[^\]]+\]\]\s*)+$/.test(s)) {
      flush();
      const items = [...s.matchAll(/\[\[([^|\]]+)\|?([^\]]*)\]\]/g)].map((x) => [x[1].trim(), x[2].trim()] as [string, string]);
      blocks.push({ t: 'stats', items });
      continue;
    }
    if (/^[*-]\s+/.test(s)) {
      flush();
      const prev = blocks[blocks.length - 1];
      const item = s.replace(/^[*-]\s+/, '');
      if (prev?.t === 'list') prev.items.push(item); else blocks.push({ t: 'list', items: [item] });
      continue;
    }
    para.push(s);
  }
  flush();
  return blocks;
}

function render(blocks: Block[], prefix = 'b'): ReactNode[] {
  return blocks.map((b, i) => {
    const k = `${prefix}${i}`;
    switch (b.t) {
      case 'h1': return <h2 key={k} className="md-title">{inline(b.text, k)}</h2>;
      case 'h2': {
        const m = b.text.match(/^(\d+|[IVX]+)[.)]\s*(.*)$/);
        return (
          <h3 key={k} className="md-chapter">
            {m && <span className="md-num">{m[1]}</span>}
            <span>{inline(m ? m[2] : b.text, k)}</span>
          </h3>
        );
      }
      case 'h3': return <h4 key={k} className="md-sub">{inline(b.text, k)}</h4>;
      case 'h4': return <p key={k} className="md-label">{inline(b.text, k)}</p>;
      case 'p': return <p key={k} className="md-p">{b.text.split('\n').flatMap((l, j) => (j ? [<br key={`${k}-br${j}`} />, ...inline(l, `${k}-${j}`)] : inline(l, `${k}-${j}`)))}</p>;
      case 'note': return <aside key={k} className="md-note">{inline(b.text, k)}</aside>;
      case 'end': return <p key={k} className="md-end">{inline(b.text, k)}</p>;
      case 'hr': return <div key={k} className="md-hr" aria-hidden="true">❦</div>;
      case 'list': return <ul key={k} className="md-list">{b.items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>)}</ul>;
      case 'stats':
        return (
          <div key={k} className="md-stats">
            {b.items.map(([label, value], j) => (
              <div key={j} className={`md-stat${/마피아/.test(label) ? ' is-mafia' : ''}`}>
                <span className="md-stat-label">{label}</span>
                {value && <span className="md-stat-value">{value}</span>}
              </div>
            ))}
          </div>
        );
      case 'card':
        return (
          <section key={k} className="md-card">
            <span className="md-seal" aria-hidden="true" />
            <h4 className="md-card-title">{b.title}</h4>
            {render(b.body, `${k}-`)}
          </section>
        );
    }
  });
}

export function Markdown({ source }: { source: string }) {
  return <>{render(parse(source.replace(/\r/g, '').split('\n')))}</>;
}
