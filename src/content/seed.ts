import { placeholder } from '../lib/placeholder';
import type { AssetDef, CharacterDef, ContentData, EpisodeDef } from './types';

/**
 * Built-in content used until real material exists (or when no published
 * content.json is found). Every item here is a PLACEHOLDER or TEST entry.
 */
const pending = '자료 대기 중';
const hues = [28, 350, 200, 90, 260, 45];

const characters: CharacterDef[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((L, i) => ({
  id: L.toLowerCase(),
  name: `인물 ${L}`,
  nameEn: `CHARACTER ${L}`,
  aliases: [L, L.toLowerCase()],
  color: `hsl(${hues[i]} 40% 62%)`,
  epithet: '임시 등록 인물',
  intro: '이 칸에는 제공될 인물 소개문이 들어갑니다. 현재 표시되는 내용은 레이아웃 확인용 임시 문구입니다.',
  fields: ['이름', '나이', '직업', '관계', '설정'].map((label) => ({ label, value: pending })),
  placeholder: true,
}));

const now = 0;
const assets: AssetDef[] = [
  { id: 'bg-01', kind: 'bg', name: '배경01', src: placeholder(1920, 1080, 'BACKGROUND 01', 'background', 28), width: 1920, height: 1080, gallery: true, created: now },
  { id: 'bg-02', kind: 'bg', name: '배경02', src: placeholder(1920, 1080, 'BACKGROUND 02', 'background', 210), width: 1920, height: 1080, gallery: true, created: now },
  { id: 'cg-01', kind: 'cg', name: '삽화01', src: placeholder(1920, 1080, 'ILLUSTRATION 01', 'illustration', 350), width: 1920, height: 1080, gallery: true, created: now },
  { id: 'cg-02', kind: 'cg', name: '삽화02', src: placeholder(1200, 1600, 'ILLUSTRATION 02', 'illustration', 45), width: 1200, height: 1600, gallery: true, created: now },
  { id: 'item-01', kind: 'item', name: '증거01', src: placeholder(800, 800, 'EVIDENCE 01', 'illustration', 90), width: 800, height: 800, gallery: false, created: now },
];

const testScript = `// ─────────────────────────────────────────────
// [테스트용] 플레이어·태그 동작 확인 대본
// 실제 이야기가 아닙니다. 기능 확인이 끝나면 지워도 됩니다.
// ─────────────────────────────────────────────
@배경 배경01
(#자막) [테스트] 자막 — 장소나 시간을 적는 작은 칸
[테스트 대사] 기본 해설입니다. 클릭하거나 Space · Enter · → 키로 넘깁니다.

(#기본 #가운데) 인물 A: [테스트 대사] 처음 말하면 자동으로 페이드인 등장합니다.
(#기쁨)(#통통) 인물 A: [테스트 대사] #기쁨 #통통 — 표정이 바뀌고 작게 통통 튑니다.
(#놀람 #오른쪽에서 #오른쪽) 인물 B: [테스트 대사] 오른쪽에서 걸어 들어왔습니다.
(#왼쪽) 인물 A: [테스트 대사] 위치 태그로 왼쪽으로 이동합니다.
(#공포 #떨림) 인물 B: [테스트 대사] #떨림 — 이 대사 동안 바들바들 떱니다.
(#깜짝) 인물 A: [테스트 대사] #깜짝 — 한 번 크게 뜁니다.
@동작 인물 B #끄덕 #진지
인물 A: [테스트 대사] 말하지 않는 인물 B에게 @동작 으로 끄덕임을 줬습니다.
(#속마음) 인물 A: [테스트 대사] 속마음은 괄호 안 흐린 글씨로 보입니다.
인물 A[???]: [테스트 대사] 이름을 ???로 가린 대사입니다.
(#화면밖) 인물 C: [테스트 대사] 스프라이트 없이 목소리만 들립니다.

@아이템 증거01
[테스트 대사] 가운데에 증거·아이템 이미지를 띄웠습니다.
@아이템 끝
(#칸) [테스트] 장면을 어둡게 하고 만화칸에 해설을 띄웁니다.
(#암전칸) [테스트] 화면을 검게 가리고 만화칸을 띄웁니다.
(#강조) [테스트] 대사창 없는 큰 글씨

@퇴장 인물 B #오른쪽으로
인물 A: [테스트 대사] 인물 B가 오른쪽으로 퇴장했습니다.
@배경 배경02 #암전전환
@모두퇴장
@삽화 삽화01
[테스트 대사] 배경을 암전 전환으로 바꾸고, 화면 전체 삽화를 띄웠습니다.
@삽화 끝
(#붉은번쩍 #화면흔들림) [테스트] 붉게 번쩍이며 화면이 흔들립니다.
[테스트 대사] 마지막 줄입니다.
`;

const episodes: EpisodeDef[] = [
  { id: 'test', number: '0', title: '플레이어 테스트', subtitle: '[테스트용] 태그·연출 동작 확인', status: 'available', test: true, thumbnail: 'bg-01', script: testScript },
  ...['I', 'II', 'III'].map((n, i): EpisodeDef => ({
    id: `ep${i + 1}`, number: n, title: '제목 미정', subtitle: '원고 대기 중', status: 'sealed', script: '',
  })),
];

export const seedContent = (): ContentData => ({ version: 1, characters, assets, episodes, updatedAt: 0 });
