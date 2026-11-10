import type { InvestigationDef } from '../content/types';

/** Clickable evidence spots of an investigation, laid over the stage. */
export function Hotspots({ inv, done, onPick, preview }: {
  inv: InvestigationDef;
  done?: Set<string>;
  onPick?: (id: string) => void;
  /** editor preview: always outlined, not clickable */
  preview?: boolean;
}) {
  return (
    <div className={`vn-hotspots${preview ? ' is-editor-hotspots' : ''}`}>
      {inv.hotspots.map((h) => (
        <button
          key={h.id}
          type="button"
          className={`vn-hotspot${done?.has(h.id) ? ' is-done' : ''}`}
          style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
          onClick={(e) => { e.stopPropagation(); onPick?.(h.id); }}
          tabIndex={preview ? -1 : 0}
          aria-label={`${h.label || '조사'}${done?.has(h.id) ? ' (조사함)' : ''}`}
        >
          <span className="vn-hotspot-label">{h.label || '조사'}</span>
        </button>
      ))}
    </div>
  );
}

/** Spots that must be examined before the story moves on. */
export const requiredSpots = (inv: InvestigationDef) => inv.hotspots.filter((h) => !h.optional);
