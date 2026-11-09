import type { ReactNode } from 'react';
import { navigate } from '../lib/router';

interface Props {
  kind: 'episodes' | 'profiles' | 'gallery' | 'rules';
  eyebrow: string;
  title: string;
  children: ReactNode;
}

/** Shared frame for the four sub-pages: back-to-desk control + heading. */
export function SubPage({ kind, eyebrow, title, children }: Props) {
  return (
    <div className={`subpage subpage-${kind}`}>
      <header className="subpage-head">
        <button type="button" className="back-btn" onClick={() => navigate('')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
          <span>책상으로</span>
        </button>
        <div className="subpage-titles">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        <span className="head-spacer" aria-hidden="true" />
      </header>
      <main className="subpage-body">{children}</main>
    </div>
  );
}
