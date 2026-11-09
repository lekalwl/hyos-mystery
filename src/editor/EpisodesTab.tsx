import { useState } from 'react';
import type { ContentData, EpisodeDef } from '../content/types';
import { assetUrl, newId, updateContent } from '../content/store';
import { outfitsOf } from '../content/sprites';

const patch = (id: string, p: Partial<EpisodeDef>) =>
  updateContent((d) => ({ ...d, episodes: d.episodes.map((e) => (e.id === id ? { ...e, ...p } : e)) }));

export function EpisodesTab({ data, current, onSelect }: { data: ContentData; current: string; onSelect: (id: string) => void }) {
  const ep = data.episodes.find((e) => e.id === current) ?? data.episodes[0];
  const [confirm, setConfirm] = useState(false);
  const thumbs = data.assets.filter((a) => a.kind === 'bg' || a.kind === 'cg');

  const add = () => {
    const id = newId('ep');
    updateContent((d) => ({ ...d, episodes: [...d.episodes, { id, number: String(d.episodes.length), title: '새 에피소드', status: 'sealed', script: '' }] }));
    onSelect(id);
  };
  const move = (dir: -1 | 1) => updateContent((d) => {
    const i = d.episodes.findIndex((e) => e.id === ep.id);
    const j = i + dir;
    if (j < 0 || j >= d.episodes.length) return d;
    const list = [...d.episodes];
    [list[i], list[j]] = [list[j], list[i]];
    return { ...d, episodes: list };
  });

  return (
    <div className="ed-chars">
      <aside className="ed-list">
        <ul>
          {data.episodes.map((e) => (
            <li key={e.id}>
              <button type="button" className={e.id === ep?.id ? 'is-current' : ''} onClick={() => { onSelect(e.id); setConfirm(false); }}>
                <span className="ep-no">{e.number}</span>{e.title}
                <small>{e.status === 'available' ? '공개' : '봉인'}</small>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="text-btn light" onClick={add}>+ 에피소드 추가</button>
      </aside>

      {ep && (
        <div className="ed-form" key={ep.id}>
          <div className="ed-row wrap">
            <div className="ed-field narrow">
              <label htmlFor="ep-no">번호</label>
              <input id="ep-no" className="ed-input" value={ep.number} onChange={(e) => patch(ep.id, { number: e.target.value })} />
            </div>
            <div className="ed-field grow">
              <label htmlFor="ep-title">제목</label>
              <input id="ep-title" className="ed-input" value={ep.title} onChange={(e) => patch(ep.id, { title: e.target.value })} />
            </div>
          </div>
          <div className="ed-field">
            <label htmlFor="ep-sub">부제</label>
            <input id="ep-sub" className="ed-input" value={ep.subtitle ?? ''} onChange={(e) => patch(ep.id, { subtitle: e.target.value })} />
          </div>
          <div className="ed-field">
            <label htmlFor="ep-outfit">시작 의상 (이 에피소드가 시작될 때 모두가 입고 있는 의상)</label>
            <select id="ep-outfit" className="ed-input" value={ep.startOutfit ?? ''} onChange={(e) => patch(ep.id, { startOutfit: e.target.value || undefined })}>
              <option value="">각 인물의 기본 의상</option>
              {Array.from(new Set(data.characters.flatMap((c) => outfitsOf(c, data.assets)))).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="ed-row wrap">
            <label className="ed-check"><input type="radio" name="ep-status" checked={ep.status === 'available'} onChange={() => patch(ep.id, { status: 'available' })} /> 공개 (독자가 읽을 수 있음)</label>
            <label className="ed-check"><input type="radio" name="ep-status" checked={ep.status === 'sealed'} onChange={() => patch(ep.id, { status: 'sealed' })} /> 봉인 (목록에만 보임)</label>
            <label className="ed-check"><input type="checkbox" checked={!!ep.test} onChange={(e) => patch(ep.id, { test: e.target.checked })} /> TEST 표시</label>
          </div>
          <div className="ed-field">
            <span className="ed-label">썸네일 (배경·삽화 중에서)</span>
            <ul className="ed-thumbs">
              {thumbs.map((a) => (
                <li key={a.id}>
                  <button type="button" className={ep.thumbnail === a.id ? 'is-current' : ''} onClick={() => patch(ep.id, { thumbnail: a.id })}>
                    <img src={assetUrl(a.id) ?? ''} alt="" /><span>{a.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="ed-row">
            <button type="button" className="text-btn light" onClick={() => move(-1)}>▲ 위로</button>
            <button type="button" className="text-btn light" onClick={() => move(1)}>▼ 아래로</button>
            {confirm ? (
              <>
                <span className="ed-warn">대본까지 모두 지울까요?</span>
                <button type="button" className="text-btn danger" onClick={() => { updateContent((d) => ({ ...d, episodes: d.episodes.filter((x) => x.id !== ep.id) })); setConfirm(false); onSelect(data.episodes.find((x) => x.id !== ep.id)?.id ?? ''); }}>삭제</button>
                <button type="button" className="text-btn light" onClick={() => setConfirm(false)}>취소</button>
              </>
            ) : <button type="button" className="text-btn light" onClick={() => setConfirm(true)}>에피소드 삭제</button>}
          </div>
        </div>
      )}
    </div>
  );
}
