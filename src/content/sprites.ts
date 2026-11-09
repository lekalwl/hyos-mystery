import type { AssetDef, CharacterDef } from './types';

/** Sprites are keyed by character + outfit + expression. */

/** Names treated as the neutral face; a character's first such sprite is used on entry. */
export const DEFAULT_EXPRESSIONS = ['기본', '일반'];
export const outfitOf = (a: AssetDef) => a.outfit || '기본';

export function outfitsOf(c: CharacterDef, assets: AssetDef[]): string[] {
  const fromAssets = assets.filter((a) => a.kind === 'sprite' && a.character === c.id).map(outfitOf);
  const list = [...(c.outfits ?? []), ...fromAssets];
  const uniq = Array.from(new Set(list));
  return uniq.length ? uniq : ['기본'];
}

export const defaultOutfit = (c: CharacterDef, assets: AssetDef[]) => outfitsOf(c, assets)[0];

export function spritesOf(charId: string, assets: AssetDef[], outfit?: string) {
  return assets
    .filter((a) => a.kind === 'sprite' && a.character === charId && (!outfit || outfitOf(a) === outfit))
    .sort((a, b) => a.created - b.created);
}

/**
 * Find the sprite for (character, outfit, expression).
 * '기본' falls back to the outfit's first sprite, so characters without a
 * 기본 file still appear. `exact` is false when a fallback was used.
 */
export function findSprite(assets: AssetDef[], charId: string, outfit: string, expr: string): { asset?: AssetDef; exact: boolean } {
  const inOutfit = spritesOf(charId, assets, outfit);
  const hit = inOutfit.find((a) => a.expression === expr);
  if (hit) return { asset: hit, exact: true };
  if (DEFAULT_EXPRESSIONS.includes(expr)) {
    const d = inOutfit.find((a) => DEFAULT_EXPRESSIONS.includes(a.expression ?? '')) ?? inOutfit[0];
    if (d) return { asset: d, exact: true };
  }
  const other = spritesOf(charId, assets).find((a) => a.expression === expr);
  if (other) return { asset: other, exact: false };
  return { asset: undefined, exact: false };
}
