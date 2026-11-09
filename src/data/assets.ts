/**
 * Image overrides for the desk.
 * Every entry is null for now: the desk draws its objects in SVG.
 * When final art arrives, drop the PNG into public/assets/... and set the
 * path here (e.g. 'assets/objects/episode-book.png'). The object keeps its
 * hover, shadow and click behaviour; only the drawing is swapped.
 */
export const deskAssets = {
  background: null as string | null, // 'assets/backgrounds/desk-background.webp'
  objects: {
    episodes: null as string | null, // 'assets/objects/episode-book.png'
    profiles: null as string | null, // 'assets/objects/profile-locket.png'
    gallery: null as string | null, //  'assets/objects/gallery-album.png'
    rules: null as string | null, //    'assets/objects/rules-scroll.png'
  },
};
