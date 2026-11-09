# GRAYHAVEN — Murder Mystery (web)

React + TypeScript + Vite. 메인 화면은 책상 위 사물(책·로켓·사진첩·두루마리)이 곧 메뉴인 구조입니다.

```bash
npm install
npm run dev            # 개발 서버 (편집기 포함: 주소 끝에 #editor)
npm run build          # 운영자용 빌드 → dist/ (편집기 포함)
npm run build:public   # 공개용 빌드 → dist-public/ (편집기 코드가 아예 없음)
npm run passcode -- 새비밀번호   # 편집기 비밀번호 변경 (기본: grayhaven)
```

## 편집기와 공개 흐름
1. 운영자 빌드(또는 `npm run dev`)에서 `#editor` → 비밀번호 입력.
2. 라이브러리·인물·대본을 편집 → 이 브라우저(IndexedDB)에 자동 저장, 사이트 전체가 편집본으로 보임.
3. **내보내기** → `content.zip`. 압축을 풀어 나온 `content/` 폴더를 공개 사이트 폴더(index.html 옆)에 올리면 공개.
4. 공개 사이트는 시작할 때 `content/content.json`을 읽습니다. 없으면 내장 임시 데이터.
5. 다른 컴퓨터에서 이어 작업: 그 브라우저 편집기에서 **가져오기**로 zip을 열면 됩니다.

대본 문법은 `docs/대본_작성법.md`.

## 라우팅 (해시)
`#episodes` · `#episode-<id>` · `#profiles` · `#profile-<id>` · `#gallery` · `#gallery-<category>` · `#rules`
브라우저 뒤로 가기가 그대로 동작합니다.

## 자료 교체 위치
| 무엇 | 파일 |
|---|---|
| 책상 배경 / 4개 오브젝트 PNG | `src/data/assets.ts` (경로만 넣으면 SVG 대신 이미지 사용) |
| 오브젝트 위치·크기 (데스크톱/모바일 별도) | `src/components/desk/layouts.ts` |
| 에피소드·인물·라이브러리 | 편집기 (기본 임시 데이터: `src/content/seed.ts`) |
| 규칙 | `src/data/rules.ts` |

이미지 파일은 `public/assets/...` 아래에 두고 `assets/...` 상대경로로 지정합니다.
현재 들어 있는 인물·에피소드·규칙·이미지는 모두 **임시(PLACEHOLDER/테스트)** 데이터입니다.

## 플레이어 조작
클릭 / Space / Enter / → : 다음 대사 (타이핑 중이면 문장 즉시 완성)
L 또는 휠 위로 : 대사 기록 · Esc : 기록 닫기
