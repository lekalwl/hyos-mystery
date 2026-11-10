import type { AssetDef, AssetKind, CharacterDef, InvestigationDef } from '../content/types';
import { defaultOutfit, findSprite, outfitsOf } from '../content/sprites';
import {
  ANIM_BY_KEY, ANIM_BY_NAME, BGT_BY_NAME, CAM_SPEED_BY_NAME, DIR_BY_NAME, POSE_BY_NAME, FX_BY_NAME, MOD_BY_NAME, NARR_BY_NAME, POS_BY_NAME, POSITIONS,
  type NarrStyle,
} from './vocab';

/**
 * Episode script → playable steps.
 *
 *   // comment
 *   @배경 서재 #암전전환
 *   @음악 긴장
 *   (#기쁨)(#통통) 엘리: 대사          speaker line with tags
 *   (#기쁨 #통통) 엘리: 대사           tags may share one bracket
 *   엘리[???]: 대사                    sprite of 엘리, name shown as ???
 *   (#칸) 해설                         narration styles
 *   > 시간: 밤                         force narration (text contains a colon)
 *
 * Each line of dialogue/narration becomes one Step holding the full stage
 * state at that moment, so any step can be shown on its own (bookmarks,
 * editor preview) without replaying the ones before it.
 */

export interface StageChar {
  id: string;
  expr: string;
  outfit: string;
  /** asset id, or a `ph:` token for a placeholder */
  sprite: string;
  x: number;
  posKey: string;
  enter?: string;
  exit?: string;
  anim?: string;
  /** persistent pose (see POSES) */
  pose?: string;
  speaking?: boolean;
}

/** Camera: centre point in % of the stage, zoom (1 = whole stage), move duration. */
export interface Camera { x: number; y: number; zoom: number; ms: number }
export const CAMERA_HOME: Camera = { x: 50, y: 50, zoom: 1, ms: 900 };

export interface Step {
  /** 0-based source line of the text that produced this step */
  line: number;
  speaker: { name: string; color?: string; charId?: string } | null;
  text: string;
  narr: NarrStyle | null; // null = spoken line
  thought: boolean;
  bg: string | null;
  bgTransition: 'fade' | 'cut' | 'black';
  cg: string | null;
  item: string | null;
  blackout: boolean;
  chars: StageChar[];
  fx: string[];
  bgm: string | null;
  se: string[];
  camera: Camera;
  /** this step is an investigation scene (investigation id) */
  invest?: string;
}

export interface Diagnostic {
  line: number;
  level: 'error' | 'warn';
  msg: string;
}

export interface CompileContext {
  characters: CharacterDef[];
  assets: AssetDef[];
  /** episode's starting outfit for everyone who has it */
  startOutfit?: string;
  /** investigations of the episode, for @조사 */
  investigations?: InvestigationDef[];
  /** start from this stage state instead of an empty stage (investigation dialogue) */
  from?: Step;
}

const TAG_GROUP = /^\(([^)]*)\)\s*/;
const SPEAKER = /^([^:：]{1,24}?)(?:\[([^\]]{1,24})\])?\s*[:：]\s*(.*)$/;

export const placeholderToken = (kind: AssetKind, ...parts: string[]) => `ph:${kind}:${parts.join(':')}`;

function splitTags(s: string): string[] {
  return s
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);
}

export function compileScript(source: string, ctx: CompileContext) {
  const diagnostics: Diagnostic[] = [];
  const steps: Step[] = [];

  const charByName = new Map<string, CharacterDef>();
  for (const c of ctx.characters) {
    charByName.set(c.name.toLowerCase(), c);
    charByName.set(c.id.toLowerCase(), c);
    for (const a of c.aliases) if (a.trim()) charByName.set(a.trim().toLowerCase(), c);
  }
  const assetByName = (kind: AssetKind, name: string) =>
    ctx.assets.find((a) => a.kind === kind && a.name.toLowerCase() === name.toLowerCase());
  const spriteFor = (charId: string, outfit: string, expr: string, line?: number) => {
    const { asset, exact } = findSprite(ctx.assets, charId, outfit, expr);
    if (line !== undefined && !exact) {
      diagnostics.push({
        line, level: 'warn',
        msg: asset
          ? `"${charName(charId)}" ${outfit} 의상에 "${expr}" 표정이 없어 다른 의상의 것을 씀`
          : `"${charName(charId)}"의 ${outfit} · ${expr} 스프라이트가 없음 (임시 이미지로 표시)`,
      });
    }
    return asset?.id ?? placeholderToken('sprite', charId, `${outfit} · ${expr}`);
  };
  // outfit each character is currently wearing (persists off-stage)
  const wearing = new Map<string, string>();
  const outfitFor = (def: CharacterDef) => {
    const w = wearing.get(def.id);
    if (w) return w;
    const list = outfitsOf(def, ctx.assets);
    return ctx.startOutfit && list.includes(ctx.startOutfit) ? ctx.startOutfit : defaultOutfit(def, ctx.assets);
  };
  const resolveAssetId = (kind: AssetKind, id: string) => ctx.assets.find((a) => a.kind === kind && a.id === id)?.id;
  const resolveAsset = (kind: AssetKind, name: string, line: number) => {
    const a = assetByName(kind, name);
    if (a) return a.id;
    diagnostics.push({ line, level: 'warn', msg: `라이브러리에 없는 ${kindWord(kind)}: "${name}" (임시 이미지로 표시)` });
    return placeholderToken(kind, name);
  };

  // running stage state
  let bg: string | null = null;
  let bgTransition: Step['bgTransition'] = 'fade';
  let cg: string | null = null;
  let item: string | null = null;
  let blackout = false;
  let bgm: string | null = null;
  let camera: Camera = { ...CAMERA_HOME };
  const chars = new Map<string, StageChar>();
  if (ctx.from) {
    const f = ctx.from;
    bg = f.bg; cg = f.cg; item = null; blackout = f.blackout; bgm = f.bgm; camera = { ...f.camera };
    for (const c of f.chars) {
      if (c.exit) continue;
      chars.set(c.id, { ...c, enter: undefined, anim: undefined, speaking: undefined });
      wearing.set(c.id, c.outfit);
    }
  }
  let exiting: StageChar[] = [];
  let pendingFx: string[] = [];
  let pendingSe: string[] = [];

  const freeX = () => {
    const used = new Set([...chars.values()].map((c) => c.posKey));
    const order = ['center', 'left', 'right', 'farleft', 'farright'];
    const key = order.find((k) => !used.has(k)) ?? 'center';
    return POSITIONS.find((p) => p.key === key)!;
  };

  /** Apply a list of character tags; returns leftovers it didn't understand. */
  const applyCharTags = (c: StageChar, tags: string[], line: number) => {
    for (const t of tags) {
      const low = t.toLowerCase();
      const pos = POS_BY_NAME.get(low);
      if (pos) { c.x = pos.x; c.posKey = pos.key; continue; }
      const pose = POSE_BY_NAME.get(low);
      if (pose) { if (pose.key === 'none') delete c.pose; else c.pose = pose.key; continue; }
      const anim = ANIM_BY_NAME.get(low);
      if (anim) {
        if (anim.kind === 'enter') c.enter = anim.key;
        else if (anim.kind === 'exit') diagnostics.push({ line, level: 'warn', msg: `#${t} 는 @퇴장 줄에서 쓰세요` });
        else c.anim = anim.key;
        continue;
      }
      const def = ctx.characters.find((x) => x.id === c.id);
      if (def && outfitsOf(def, ctx.assets).includes(t)) {
        c.outfit = t;
        wearing.set(c.id, t);
        c.sprite = spriteFor(c.id, c.outfit, c.expr, line);
        continue;
      }
      // anything else is an expression name
      c.expr = t;
      c.sprite = spriteFor(c.id, c.outfit, t, line);
    }
  };

  const charName = (id: string) => ctx.characters.find((c) => c.id === id)?.name ?? id;

  const enterChar = (def: CharacterDef) => {
    const p = freeX();
    const outfit = outfitFor(def);
    const c: StageChar = { id: def.id, expr: '기본', outfit, sprite: spriteFor(def.id, outfit, '기본'), x: p.x, posKey: p.key, enter: 'fadein' };
    chars.set(def.id, c);
    return c;
  };

  const emit = (s: Omit<Step, 'bg' | 'bgTransition' | 'cg' | 'item' | 'blackout' | 'chars' | 'fx' | 'bgm' | 'se' | 'camera'>) => {
    steps.push({
      ...s,
      bg, bgTransition, cg, item, blackout, bgm, camera: { ...camera },
      chars: [...[...chars.values()].map((c) => ({ ...c })), ...exiting],
      fx: pendingFx,
      se: pendingSe,
    });
    for (const c of chars.values()) { delete c.enter; delete c.anim; delete c.speaking; }
    exiting = [];
    pendingFx = [];
    pendingSe = [];
    bgTransition = 'fade';
  };

  const lines = source.replace(/\r/g, '').split('\n');
  lines.forEach((raw, ln) => {
    let text = raw.trim();
    if (!text || text.startsWith('//')) return;

    // ── directives ──
    if (text.startsWith('@')) {
      const parts = text.slice(1).trim().split(/\s+/);
      const cmd = DIR_BY_NAME.get((parts.shift() ?? '').toLowerCase());
      const tags = parts.filter((p) => p.startsWith('#')).map((p) => p.slice(1));
      const arg = parts.filter((p) => !p.startsWith('#')).join(' ');
      const isEnd = /^(끝|stop|end|없음|off)$/i.test(arg);
      if (!cmd) { diagnostics.push({ line: ln, level: 'error', msg: `알 수 없는 명령: ${text.split(/\s/)[0]}` }); return; }
      switch (cmd.key) {
        case 'bg': {
          if (!arg) { diagnostics.push({ line: ln, level: 'error', msg: '@배경 뒤에 배경 이름이 필요함' }); return; }
          bg = isEnd ? null : resolveAsset('bg', arg, ln);
          const tr = tags.map((t) => BGT_BY_NAME.get(t.toLowerCase())).find(Boolean);
          bgTransition = (tr?.key as Step['bgTransition']) ?? 'fade';
          if (bgTransition === 'black') blackout = false;
          cg = null;
          return;
        }
        case 'cg': cg = !arg || isEnd ? null : resolveAsset('cg', arg, ln); return;
        case 'item': item = !arg || isEnd ? null : resolveAsset('item', arg, ln); return;
        case 'bgm': bgm = !arg || isEnd ? null : resolveAsset('bgm', arg, ln); return;
        case 'se': if (arg) pendingSe.push(resolveAsset('se', arg, ln)); return;
        case 'fx': {
          for (const t of tags) {
            const fx = FX_BY_NAME.get(t.toLowerCase());
            if (!fx) { diagnostics.push({ line: ln, level: 'warn', msg: `알 수 없는 화면 효과: #${t}` }); continue; }
            if (fx.key === 'blackout') blackout = true;
            else if (fx.key === 'unblackout') blackout = false;
            else pendingFx.push(fx.key);
          }
          return;
        }
        case 'camera': {
          const speed = tags.map((t) => CAM_SPEED_BY_NAME.get(t.toLowerCase())).find(Boolean);
          const ms = speed?.ms ?? CAMERA_HOME.ms;
          const words = arg.split(/\s+/).filter(Boolean);
          if (!words.length || /^(전체|원래대로|처음|reset|home|끝)$/i.test(words[0])) { camera = { ...CAMERA_HOME, ms }; return; }
          const nums = words.map(Number);
          let x: number, y: number, zoom: number;
          if (words.length >= 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
            x = nums[0]; y = nums[1]; zoom = isNaN(nums[2]) ? camera.zoom : nums[2];
          } else {
            const target = words[0].toLowerCase();
            zoom = isNaN(nums[1]) ? 1.8 : nums[1];
            const pos = POS_BY_NAME.get(target);
            const def = charByName.get(target);
            if (def) {
              const c = chars.get(def.id);
              if (!c) diagnostics.push({ line: ln, level: 'warn', msg: `"${def.name}"은(는) 화면에 없어 가운데를 비춤` });
              x = c?.x ?? 50; y = 34;
            } else if (pos) { x = pos.x; y = 45; zoom = isNaN(nums[1]) ? 1.5 : nums[1]; }
            else { diagnostics.push({ line: ln, level: 'error', msg: '@카메라 x y 배율 / @카메라 인물이름 배율 / @카메라 전체' }); return; }
          }
          camera = clampCamera({ x, y, zoom, ms });
          return;
        }
        case 'invest': {
          const inv = ctx.investigations?.find((i) => i.name.toLowerCase() === arg.toLowerCase());
          if (!inv) { diagnostics.push({ line: ln, level: 'error', msg: arg ? `조사 탭에 없는 조사: "${arg}"` : '@조사 뒤에 조사 이름이 필요함' }); return; }
          if (!inv.hotspots.length) diagnostics.push({ line: ln, level: 'warn', msg: `조사 "${inv.name}"에 조사할 곳이 없음` });
          if (inv.bg) { bg = resolveAssetId('bg', inv.bg) ?? bg; cg = null; }
          const keep = new Map(chars);
          if (!inv.keepChars) {
            for (const c of chars.values()) exiting.push({ ...c, exit: 'fadeout', enter: undefined, anim: undefined });
            chars.clear();
          }
          emit({ line: ln, speaker: null, text: inv.prompt?.trim() || '조사할 곳을 눌러 보세요.', narr: 'box', thought: false, invest: inv.id });
          if (!inv.keepChars) for (const [k, c] of keep) chars.set(k, { ...c, enter: 'fadein' });
          return;
        }
        case 'outfit': {
          // @의상 인물 의상이름   /   @의상 모두 의상이름
          const [who, ...rest] = arg.split(/\s+/);
          const name = rest.join(' ') || tags[0];
          if (!who || !name) { diagnostics.push({ line: ln, level: 'error', msg: '@의상 인물(또는 모두) 의상이름' }); return; }
          const targets = /^(모두|all)$/i.test(who) ? ctx.characters : [charByName.get(who.toLowerCase())].filter(Boolean) as CharacterDef[];
          if (!targets.length) { diagnostics.push({ line: ln, level: 'error', msg: `등록되지 않은 인물: "${who}"` }); return; }
          let applied = 0;
          for (const def of targets) {
            if (!outfitsOf(def, ctx.assets).includes(name)) continue;
            applied++;
            wearing.set(def.id, name);
            const c = chars.get(def.id);
            if (c) { c.outfit = name; c.sprite = spriteFor(def.id, name, c.expr, ln); }
          }
          if (!applied) diagnostics.push({ line: ln, level: 'warn', msg: `"${name}" 의상을 가진 인물이 없음` });
          return;
        }
        case 'exitall': {
          const anim = tags.map((t) => ANIM_BY_NAME.get(t.toLowerCase())).find((a) => a?.kind === 'exit');
          for (const c of chars.values()) exiting.push({ ...c, exit: anim?.key ?? 'fadeout', enter: undefined, anim: undefined });
          chars.clear();
          return;
        }
        case 'show': case 'act': case 'exit': {
          const def = charByName.get(arg.toLowerCase());
          if (!def) { diagnostics.push({ line: ln, level: 'error', msg: `등록되지 않은 인물: "${arg}"` }); return; }
          if (cmd.key === 'exit') {
            const c = chars.get(def.id);
            if (!c) { diagnostics.push({ line: ln, level: 'warn', msg: `"${def.name}"은(는) 화면에 없음` }); return; }
            const anim = tags.map((t) => ANIM_BY_NAME.get(t.toLowerCase())).find((a) => a?.kind === 'exit');
            exiting.push({ ...c, exit: anim?.key ?? 'fadeout', enter: undefined, anim: undefined });
            chars.delete(def.id);
            return;
          }
          const c = chars.get(def.id) ?? enterChar(def);
          applyCharTags(c, tags, ln);
          return;
        }
      }
      return;
    }

    // ── text lines ──
    const tags: string[] = [];
    let forcedNarr = false;
    if (text.startsWith('>')) { forcedNarr = true; text = text.slice(1).trim(); }
    let m: RegExpMatchArray | null;
    while ((m = text.match(TAG_GROUP))) { tags.push(...splitTags(m[1])); text = text.slice(m[0].length); }
    // bare leading #tags are allowed too:  #기쁨 #통통 엘리: ...
    while ((m = text.match(/^#(\S+)\s+/))) { tags.push(m[1]); text = text.slice(m[0].length); }

    let narr: NarrStyle | null = null;
    let thought = false;
    let offscreen = false;
    const rest: string[] = [];
    for (const t of tags) {
      const low = t.toLowerCase();
      const ns = NARR_BY_NAME.get(low);
      if (ns) { narr = ns.key; continue; }
      const fx = FX_BY_NAME.get(low);
      if (fx) {
        if (fx.key === 'blackout') blackout = true;
        else if (fx.key === 'unblackout') blackout = false;
        else pendingFx.push(fx.key);
        continue;
      }
      const mod = MOD_BY_NAME.get(low);
      if (mod) { if (mod.key === 'thought') thought = true; else offscreen = true; continue; }
      rest.push(t);
    }

    const sm = !forcedNarr && !narr ? text.match(SPEAKER) : null;
    if (sm) {
      const who = sm[1].trim();
      const shown = sm[2]?.trim();
      const body = sm[3];
      const def = charByName.get(who.toLowerCase());
      if (def) {
        if (!offscreen) {
          const c = chars.get(def.id) ?? enterChar(def);
          applyCharTags(c, rest, ln);
          c.speaking = true;
        } else if (rest.length) {
          diagnostics.push({ line: ln, level: 'warn', msg: '#화면밖 줄의 표정·동작 태그는 무시됨' });
        }
        emit({ line: ln, speaker: { name: shown ?? def.name, color: def.color, charId: def.id }, text: body, narr: null, thought });
      } else {
        if (rest.length) diagnostics.push({ line: ln, level: 'warn', msg: `등록되지 않은 화자 "${who}" — 태그 ${rest.map((t) => '#' + t).join(' ')} 무시됨` });
        emit({ line: ln, speaker: { name: shown ?? who }, text: body, narr: null, thought });
      }
      return;
    }

    for (const t of rest) {
      if (!ANIM_BY_KEY.has(t)) diagnostics.push({ line: ln, level: 'warn', msg: `해설 줄에서 쓸 수 없는 태그: #${t}` });
    }
    emit({ line: ln, speaker: null, text, narr: narr ?? 'box', thought: false });
  });

  if (!steps.length) diagnostics.push({ line: 0, level: 'warn', msg: '표시할 대사·해설 줄이 없음' });
  return { steps, diagnostics };
}

export function clampCamera(c: Camera): Camera {
  const zoom = Math.min(4, Math.max(0.5, c.zoom || 1));
  if (zoom <= 1) return { ...c, zoom, x: 50, y: 50 };
  const half = 50 / zoom;
  const cl = (v: number) => Math.min(100 - half, Math.max(half, v));
  return { ...c, zoom, x: cl(c.x), y: cl(c.y) };
}

function kindWord(k: AssetKind) {
  return { bg: '배경', cg: '삽화', item: '아이템', sprite: '스프라이트', portrait: '초상', bgm: '음악', se: '효과음' }[k];
}

/** Index of the step to preview for a given source line (last step at or before it). */
export function stepAtLine(steps: Step[], line: number) {
  let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].line <= line) idx = i;
    else break;
  }
  return idx;
}
