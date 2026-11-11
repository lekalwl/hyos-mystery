/** Everything the site shows comes from one ContentData document. */

export type AssetKind = 'bg' | 'cg' | 'item' | 'sprite' | 'portrait' | 'bgm' | 'se';

export interface AssetDef {
  id: string;
  kind: AssetKind;
  /** Name used in scripts, unique within its kind (sprites: unique per character+expression). */
  name: string;
  /** Published URL (relative) or data URI. Absent for files that live only in the editor's browser storage. */
  src?: string;
  mime?: string;
  width?: number;
  height?: number;
  /** sprite / portrait owner */
  character?: string;
  /** sprite expression */
  expression?: string;
  /** fraction of the image height where visible content starts (for face crops) */
  top?: number;
  /** sprite outfit (skin); missing = '기본' */
  outfit?: string;
  /** Show in the public gallery (images only). */
  gallery?: boolean;
  created: number;
}

export interface ProfileField { label: string; value: string }

export interface CharacterDef {
  id: string;
  name: string;
  nameEn?: string;
  /** Other spellings accepted in scripts. */
  aliases: string[];
  color: string;
  epithet?: string;
  intro: string;
  fields: ProfileField[];
  placeholder?: boolean;
  /** Outfit names in display order; the first is the default. */
  outfits?: string[];
  /** Show on the profile board before the reader has met them. */
  alwaysShown?: boolean;
  /** Raise the sprite by this % of stage height (overrides the automatic lift). */
  stageLift?: number;
  /** Don't mirror this character's sprite when standing on the right. */
  noFlip?: boolean;
  /** Case-board photo framing set in the editor (see boardPhoto). */
  photoCrop?: PhotoCrop;
}

export interface EpisodeDef {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  status: 'available' | 'sealed';
  test?: boolean;
  /** asset id (bg or cg) */
  thumbnail?: string;
  /** Outfit every character starts this episode in (if they have it). */
  startOutfit?: string;
  script: string;
  /** Investigation scenes, started from the script with `@조사 이름`. */
  investigations?: InvestigationDef[];
}

/** A clickable spot on an investigation background. Coordinates in % of the 16:9 stage. */
export interface Hotspot {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number;
  /** Dialogue that plays when the spot is examined (same script language). */
  script: string;
  /** Not needed to finish the investigation. */
  optional?: boolean;
}

export interface InvestigationDef {
  id: string;
  name: string;
  /** bg asset id; empty = keep the current background */
  bg?: string;
  /** line shown while choosing */
  prompt?: string;
  /** keep the characters on screen while investigating */
  keepChars?: boolean;
  hotspots: Hotspot[];
}

export interface ContentData {
  version: 1;
  characters: CharacterDef[];
  assets: AssetDef[];
  episodes: EpisodeDef[];
  /** bgm asset id played softly on the desk and menu pages */
  menuBgm?: string;
  /** Rules document (markdown); empty = built-in default */
  rules?: string;
  /** export holds only files not yet on the site (the rest are referenced by path) */
  partial?: boolean;
  updatedAt: number;
}

export const KIND_LABEL: Record<AssetKind, string> = {
  bg: '배경',
  cg: '삽화',
  item: '아이템·증거',
  sprite: '스프라이트',
  portrait: '초상',
  bgm: '음악',
  se: '효과음',
};

/** cx, cy: point of the source image (0–1) shown at the centre of the 4:3 photo; zoom: image width ÷ photo width. */
export interface PhotoCrop { cx: number; cy: number; zoom: number }
