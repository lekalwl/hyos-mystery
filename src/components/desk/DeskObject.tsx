import type { CSSProperties, ReactNode } from 'react';
import type { Placement } from './layouts';

interface Props {
  id: string;
  placement: Placement;
  ariaLabel: string;
  description: string;
  image?: string | null;
  /** Shown on top of `image` (SVG art carries its own label). */
  label?: { en: string; ko: string };
  active?: boolean;
  dimmed?: boolean;
  onActivate: (el: HTMLButtonElement) => void;
  children: ReactNode;
}

/**
 * A desk item that is also a menu button.
 *  .desk-obj   position + rotation on the desk (never animates on hover)
 *  .obj-shadow contact shadow that stays on the desk surface
 *  .obj-lift   the item itself; rises a few px on hover / focus / touch
 */
export function DeskObject({ id, placement, ariaLabel, description, image, label, active, dimmed, onActivate, children }: Props) {
  const style = {
    '--x': `${placement.x}%`,
    '--y': `${placement.y}%`,
    '--w': `${placement.w}%`,
    '--r': `${placement.r ?? 0}deg`,
    zIndex: placement.z ?? 1,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`desk-obj obj-${id}${active ? ' is-opening' : ''}${dimmed ? ' is-dimmed' : ''}`}
      style={style}
      aria-label={ariaLabel}
      aria-describedby={`desc-${id}`}
      onClick={(e) => onActivate(e.currentTarget)}
    >
      <span className="obj-shadow" aria-hidden="true" />
      <span className="obj-lift">
        {image ? (
          <>
            <img className="obj-image" src={image} alt="" draggable={false} />
            {label && (
              <span className="obj-label image-label">
                <span className="label-en">{label.en}</span>
                <span className="label-ko">{label.ko}</span>
              </span>
            )}
          </>
        ) : (
          children
        )}
      </span>
      <span id={`desc-${id}`} className="sr-only">{description}</span>
    </button>
  );
}
