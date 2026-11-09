/**
 * The tag vocabulary for episode scripts.
 * Each entry lists every spelling the script accepts (Korean first),
 * so writers can use whichever reads naturally. The editor's tag palette
 * and help page are generated from these tables.
 */

export interface TagDef {
  key: string;
  names: string[];
  desc: string;
}

/** Horizontal sprite positions, in % of stage width (sprite centre). */
export const POSITIONS: (TagDef & { x: number })[] = [
  { key: 'farleft', names: ['왼쪽끝', 'farleft'], x: 12, desc: '화면 왼쪽 끝' },
  { key: 'left', names: ['왼쪽', 'left'], x: 28, desc: '왼쪽' },
  { key: 'center', names: ['가운데', '중앙', 'center'], x: 50, desc: '가운데' },
  { key: 'right', names: ['오른쪽', 'right'], x: 72, desc: '오른쪽' },
  { key: 'farright', names: ['오른쪽끝', 'farright'], x: 88, desc: '화면 오른쪽 끝' },
];

export type AnimKind = 'enter' | 'exit' | 'once' | 'loop';

/** Sprite animations. 'enter'/'exit' play when a character appears/leaves. */
export const SPRITE_ANIMS: (TagDef & { kind: AnimKind })[] = [
  { key: 'fadein', kind: 'enter', names: ['등장', '페이드인', 'fadein'], desc: '서서히 나타남 (기본 등장)' },
  { key: 'slidein-l', kind: 'enter', names: ['왼쪽에서', 'slideinleft'], desc: '왼쪽에서 걸어 들어옴' },
  { key: 'slidein-r', kind: 'enter', names: ['오른쪽에서', 'slideinright'], desc: '오른쪽에서 걸어 들어옴' },
  { key: 'pop', kind: 'enter', names: ['불쑥', 'pop'], desc: '갑자기 튀어나옴' },
  { key: 'fadeout', kind: 'exit', names: ['페이드아웃', 'fadeout'], desc: '서서히 사라짐 (기본 퇴장)' },
  { key: 'slideout-l', kind: 'exit', names: ['왼쪽으로', 'slideoutleft'], desc: '왼쪽으로 걸어 나감' },
  { key: 'slideout-r', kind: 'exit', names: ['오른쪽으로', 'slideoutright'], desc: '오른쪽으로 걸어 나감' },
  { key: 'hop', kind: 'once', names: ['통통', '통통튐', 'hop'], desc: '작게 두 번 통통 튐' },
  { key: 'jump', kind: 'once', names: ['깜짝', 'jump'], desc: '깜짝 놀라 한 번 크게 뜀' },
  { key: 'nod', kind: 'once', names: ['끄덕', 'nod'], desc: '고개를 끄덕이듯 살짝 내려갔다 올라옴' },
  { key: 'shakehead', kind: 'once', names: ['도리도리', 'shakehead'], desc: '좌우로 고개를 젓듯 흔들림' },
  { key: 'flinch', kind: 'once', names: ['움찔', 'flinch'], desc: '움찔하며 뒤로 살짝 물러남' },
  { key: 'approach', kind: 'once', names: ['다가섬', 'approach'], desc: '한 걸음 다가오듯 커졌다 돌아옴' },
  { key: 'tremble', kind: 'loop', names: ['떨림', '바들바들', 'tremble'], desc: '대사 동안 바들바들 떨림' },
  { key: 'sway', kind: 'loop', names: ['흔들흔들', 'sway'], desc: '대사 동안 천천히 좌우로 흔들림' },
  { key: 'breathe', kind: 'loop', names: ['숨참', '헐떡', 'breathe'], desc: '숨을 몰아쉬듯 어깨가 들썩임' },
];

/** Whole-screen effects, fired when the line appears. */
export const SCREEN_FX: TagDef[] = [
  { key: 'shake', names: ['화면흔들림', '흔들림', 'shake'], desc: '화면 전체가 흔들림' },
  { key: 'flash', names: ['번쩍', 'flash'], desc: '하얗게 번쩍임' },
  { key: 'redflash', names: ['붉은번쩍', 'redflash'], desc: '붉게 번쩍임' },
  { key: 'blackout', names: ['암전', 'blackout'], desc: '화면을 검게 덮음 (암전해제까지 유지)' },
  { key: 'unblackout', names: ['암전해제', 'unblackout'], desc: '암전을 걷어냄' },
];

/** How a narration line (no speaker) is presented. */
export type NarrStyle = 'box' | 'panel' | 'blackpanel' | 'caption' | 'emphasis';
export const NARR_STYLES: (TagDef & { key: NarrStyle })[] = [
  { key: 'box', names: ['해설', 'box'], desc: '기본 대사창에 해설 (태그 없이 써도 됨)' },
  { key: 'panel', names: ['칸', '만화칸', 'panel'], desc: '장면을 어둡게 하고 가운데 만화칸에 해설' },
  { key: 'blackpanel', names: ['암전칸', 'blackpanel'], desc: '화면을 검게 가리고 가운데 만화칸에 해설' },
  { key: 'caption', names: ['자막', '캡션', 'caption'], desc: '왼쪽 위 작은 설명칸 (장소·시간 표기용)' },
  { key: 'emphasis', names: ['강조', 'emphasis'], desc: '대사창 없이 화면 가운데 큰 글씨' },
];

/** Line modifiers for speaker lines. */
export const LINE_MODS: TagDef[] = [
  { key: 'thought', names: ['속마음', 'thought'], desc: '속마음 — 괄호와 흐린 글씨로 표시' },
  { key: 'offscreen', names: ['화면밖', '목소리', 'offscreen'], desc: '스프라이트 없이 목소리만' },
];

/** Background transitions for @배경. */
export const BG_TRANSITIONS: TagDef[] = [
  { key: 'fade', names: ['페이드', 'fade'], desc: '부드럽게 바뀜 (기본)' },
  { key: 'cut', names: ['즉시', 'cut'], desc: '바로 바뀜' },
  { key: 'black', names: ['암전전환', 'black'], desc: '검게 꺼졌다가 바뀜' },
];

/** Suggested expression names (any name works; these show in the palette). */
export const COMMON_EXPRESSIONS = ['일반', '미소', '기쁨', '슬픔', '분노', '놀람', '당황', '진지', '의심', '곤란', '공포', '부끄러움'];

/** Directives: lines starting with @. */
export const DIRECTIVES: TagDef[] = [
  { key: 'bg', names: ['배경', 'bg'], desc: '@배경 이름 (#즉시 / #암전전환)' },
  { key: 'cg', names: ['삽화', '일러스트', 'cg'], desc: '@삽화 이름 — 화면 전체 일러스트 / @삽화 끝' },
  { key: 'item', names: ['아이템', '증거', 'item'], desc: '@아이템 이름 — 가운데에 증거·아이템 / @아이템 끝' },
  { key: 'bgm', names: ['음악', 'bgm'], desc: '@음악 이름 (반복 재생) / @음악 끝' },
  { key: 'se', names: ['효과음', 'se'], desc: '@효과음 이름 — 다음 줄과 함께 한 번 재생' },
  { key: 'show', names: ['등장', 'show'], desc: '@등장 인물 (#표정 #위치 #애니) — 말하지 않고 등장' },
  { key: 'act', names: ['동작', 'act'], desc: '@동작 인물 #표정 #애니 #위치 — 말하지 않는 인물에게 연출' },
  { key: 'exit', names: ['퇴장', 'exit'], desc: '@퇴장 인물 (#왼쪽으로 / #오른쪽으로)' },
  { key: 'exitall', names: ['모두퇴장', 'exitall'], desc: '@모두퇴장 — 모든 인물 퇴장' },
  { key: 'fx', names: ['화면', 'fx'], desc: '@화면 #암전 / #번쩍 … — 다음 줄에 화면 효과' },
  { key: 'outfit', names: ['의상', 'outfit'], desc: '@의상 인물 의상이름 / @의상 모두 인게임 — 이후 그 의상으로' },
];

const index = <T extends TagDef>(list: T[]) => {
  const m = new Map<string, T>();
  for (const d of list) for (const n of d.names) m.set(n.toLowerCase(), d);
  return m;
};
export const POS_BY_NAME = index(POSITIONS);
export const ANIM_BY_NAME = index(SPRITE_ANIMS);
export const FX_BY_NAME = index(SCREEN_FX);
export const NARR_BY_NAME = index(NARR_STYLES);
export const MOD_BY_NAME = index(LINE_MODS);
export const BGT_BY_NAME = index(BG_TRANSITIONS);
export const DIR_BY_NAME = index(DIRECTIVES);
export const ANIM_BY_KEY = new Map(SPRITE_ANIMS.map((a) => [a.key, a]));
