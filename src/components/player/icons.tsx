/** Line icons for the reader menu (24×24, stroke = currentColor). */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconFold = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M12 3 L14 9 L20 9 L15 13 L17 20 L12 16 L7 20 L9 13 L4 9 L10 9 Z" /></svg>
);
export const IconBookmarkAdd = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M7 3 H17 V21 L12 17 L7 21 Z" /><path {...S} d="M12 7 V13 M9 10 H15" /></svg>
);
export const IconBookmarkOpen = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M3 6 C6 4.5 9 4.5 12 6 C15 4.5 18 4.5 21 6 V19 C18 17.5 15 17.5 12 19 C9 17.5 6 17.5 3 19 Z" /><path {...S} d="M12 6 V19" /><path {...S} d="M15.5 5.3 V11 L17 10 L18.5 11 V5.4" /></svg>
);
export const IconMemo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M5 3 H15 L19 7 V21 H5 Z" /><path {...S} d="M8 10 H16 M8 13.5 H16 M8 17 H12" /><path {...S} d="M15 3 V7 H19" /></svg>
);
export const IconLog = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M4 6 H20 M4 11 H20 M4 16 H14" /><path {...S} d="M17 16 L19 18 L22 14" /></svg>
);
export const IconClose = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M6 6 L18 18 M18 6 L6 18" /></svg>
);
export const IconSound = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M4 9 H8 L13 5 V19 L8 15 H4 Z" /><path {...S} d="M16 9 C17.5 10.5 17.5 13.5 16 15 M18.5 6.5 C21.5 9.5 21.5 14.5 18.5 17.5" /></svg>
);
export const IconMute = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path {...S} d="M4 9 H8 L13 5 V19 L8 15 H4 Z" /><path {...S} d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" /></svg>
);
