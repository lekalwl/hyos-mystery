/**
 * Desk compositions. x / w are % of stage width, y is % of stage height,
 * r is rotation in degrees, z is stacking order.
 * The phone layout is its own composition, not a scaled-down desktop.
 */
export type MenuKey = 'episodes' | 'profiles' | 'gallery' | 'rules';
export type DecoKey = 'candle' | 'inkwell' | 'magnifier' | 'opener' | 'papers' | 'photo1' | 'photo2';

export interface Placement { x: number; y: number; w: number; r?: number; z?: number }

export interface DeskLayout {
  name: 'wide' | 'tall';
  aspect: number; // width / height of the stage
  menu: Record<MenuKey, Placement>;
  deco: Partial<Record<DecoKey, Placement>>;
  title: { x: number; y: number; w: number; align: 'left' | 'center' | 'right' };
}

export const wideLayout: DeskLayout = {
  name: 'wide',
  aspect: 16 / 9,
  menu: {
    episodes: { x: 37, y: 15, w: 41, r: -1.5, z: 5 },
    profiles: { x: 11, y: 17, w: 19, r: 6, z: 9 },
    gallery: { x: 2, y: 53, w: 31, r: -7, z: 7 },
    rules: { x: 54, y: 69.5, w: 29, r: -4, z: 8 },
  },
  deco: {
    papers: { x: 15, y: 30, w: 24, r: 8, z: 2 },
    photo1: { x: 31, y: 74, w: 9, r: 14, z: 3 },
    candle: { x: 83, y: 46, w: 12, z: 4 },
    inkwell: { x: 27, y: 1, w: 10, r: -4, z: 3 },
    magnifier: { x: 81, y: 70, w: 17, r: -4, z: 4 },
    photo2: { x: 79, y: 22, w: 8, r: -10, z: 2 },
  },
  title: { x: 54, y: 2.5, w: 43, align: 'right' },
};

export const tallLayout: DeskLayout = {
  name: 'tall',
  aspect: 9 / 16,
  menu: {
    episodes: { x: 10, y: 35, w: 84, r: -1.5, z: 5 },
    profiles: { x: 7, y: 12, w: 38, r: 5, z: 6 },
    gallery: { x: -2, y: 72, w: 56, r: -6, z: 7 },
    rules: { x: 45, y: 79.5, w: 54, r: -4, z: 8 },
  },
  deco: {
    candle: { x: 68, y: 14, w: 24, z: 4 },
    photo1: { x: 40, y: 20, w: 20, r: 12, z: 2 },
    papers: { x: 30, y: 61, w: 50, r: 6, z: 2 },
    photo2: { x: 74, y: 66, w: 18, r: -10, z: 3 },
  },
  title: { x: 5, y: 3, w: 90, align: 'center' },
};
