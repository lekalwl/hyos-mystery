import { BG_TRANSITIONS, CAMERA_SPEEDS, CG_PLAY, LAYERS, POSES, DIRECTIVES, LINE_MODS, NARR_STYLES, POSITIONS, SCREEN_FX, SPRITE_ANIMS, type TagDef } from '../engine/vocab';
import { SIZE_GUIDE } from './assets';

const Table = ({ title, rows, prefix = '#' }: { title: string; rows: TagDef[]; prefix?: string }) => (
  <section className="ed-help-sec">
    <h3>{title}</h3>
    <table>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <th>{r.names.filter((n) => /[가-힣]/.test(n)).map((n) => `${prefix}${n}`).join(' · ') || `${prefix}${r.names[0]}`}</th>
            <td>{r.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export function HelpTab() {
  return (
    <div className="ed-helpdoc">
      <section className="ed-help-sec">
        <h3>대본 쓰는 법</h3>
        <pre>{`// 주석은 슬래시 두 개
@배경 서재 #암전전환
@음악 긴장
(#자막) 그레이헤이븐 저택, 밤 11시

(#기쁨)(#통통) 인물 A: 대사          ← 표정·동작 태그
(#놀람 #오른쪽에서 #오른쪽) 인물 B: 대사   ← 괄호 하나에 여러 개도 가능
인물 A[???]: 대사                    ← 이름을 ???로 가림
(#속마음) 인물 A: 생각
(#화면밖) 인물 C: 목소리만

@동작 인물 B #끄덕 #진지              ← 말하지 않는 인물에게 연출
@아이템 피묻은손수건
(#칸) 손수건에는 이니셜이 새겨져 있었다.
@아이템 끝
@의상 모두 인게임                    ← 의상(스킨) 바꾸기
(#평상복 #기쁨) 인물 A: 대사          ← 줄 태그로도 의상 지정
@퇴장 인물 B #오른쪽으로
(#붉은번쩍 #화면흔들림) 비명이 울렸다.
> 시간: 밤                           ← 콜론이 든 해설은 > 로 시작`}</pre>
        <p>처음 말하는 인물은 자동으로 등장하고, 표정·위치는 바꿀 때까지 유지됩니다. 동작 태그는 그 줄에서 한 번만 재생됩니다.</p>
      </section>
      <Table title="무대 명령 (@로 시작하는 줄)" rows={DIRECTIVES} prefix="@" />
      <Table title="표정 이외의 인물 태그 — 동작" rows={SPRITE_ANIMS} />
      <Table title="자세 — 풀 때까지 유지 (#원래대로로 풀기)" rows={POSES} />
      <section className="ed-help-sec">
        <h3>카메라</h3>
        <pre>{`@카메라 엘리            ← 엘리 얼굴 쪽으로 1.8배 확대
@카메라 엘리 2.5        ← 배율 지정
@카메라 왼쪽            ← 왼쪽 자리 쪽으로 1.5배
@카메라 70 30 2         ← 가로 70%, 세로 30% 지점을 2배로 (0~100)
@카메라 전체 #천천히     ← 다시 전체 화면으로, 천천히`}</pre>
        <p>카메라는 바꿀 때까지 유지됩니다. 대본 탭 「카메라 → 화면에서 위치 고르기」로 눌러서 좌표를 정할 수 있습니다.</p>
      </section>
      <Table title="카메라 속도 (@카메라 줄 뒤에)" rows={CAMERA_SPEEDS} />
      <section className="ed-help-sec">
        <h3>조사</h3>
        <pre>{`(#진지) 인물 A: 이 방을 살펴보자.
@조사 서재조사          ← 조사 탭에서 만든 조사 장면
(#놀람) 인물 B: 역시 범인은…   ← 필수 증거를 다 보면 여기로`}</pre>
        <p>조사 탭에서 배경 위에 증거 칸을 그리고, 칸마다 눌렀을 때 나올 대화를 씁니다. 「선택」으로 표시한 칸은 안 봐도 넘어갑니다.</p>
      </section>
      <Table title="위치" rows={POSITIONS} />
      <Table title="앞뒤 순서 — 인물이 겹칠 때 (바꿀 때까지 유지)" rows={LAYERS} />
      <Table title="해설 연출" rows={NARR_STYLES} />
      <Table title="대사 꾸밈" rows={LINE_MODS} />
      <Table title="화면 효과" rows={SCREEN_FX} />
      <Table title="움짤 삽화 재생 (@삽화 줄 뒤에, GIF·움직이는 WebP)" rows={CG_PLAY} />
      <Table title="배경 전환 (@배경 줄 뒤에)" rows={BG_TRANSITIONS} />
      <section className="ed-help-sec">
        <h3>표정 태그</h3>
        <p>위 목록에 없는 태그는 모두 표정 이름으로 읽습니다. 인물 탭에서 그 이름으로 올린 스프라이트가 쓰이고, 없으면 임시 이미지가 나옵니다.</p>
      </section>
      <section className="ed-help-sec">
        <h3>권장 이미지 크기</h3>
        <table><tbody>
          {Object.entries(SIZE_GUIDE).map(([k, v]) => <tr key={k}><th>{({ bg: '배경', cg: '삽화', item: '아이템', sprite: '스프라이트', portrait: '초상', bgm: '음악', se: '효과음' } as Record<string, string>)[k]}</th><td>{v}</td></tr>)}
        </tbody></table>
      </section>
    </div>
  );
}
