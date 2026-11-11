import { useMemo, useState } from 'react';
import { useContent, assetUrl, isOperatorBrowser } from '../content/store';
import { compileScript } from '../engine/script';
import { LogView } from '../components/player/LogView';
import { navigate } from '../lib/router';
import { SubPage } from '../components/SubPage';
import { formatTime, getBookmarks, getMemo, isCompleted, latestBookmark, requestStart } from '../lib/storage';

export function EpisodesPage() {
  const { data } = useContent();
  const episodes = data.episodes;
  const [selected, setSelected] = useState(episodes[0]?.id);
  const ep = episodes.find((e) => e.id === selected) ?? episodes[0];
  const last = latestBookmark(ep.id);
  const marks = getBookmarks(ep.id).filter(Boolean).length;
  const memo = getMemo(ep.id);
  const done = isCompleted(ep.id);
  const [logFor, setLogFor] = useState<string | null>(null);
  const logEp = episodes.find((e) => e.id === logFor);
  const logSteps = useMemo(
    () => (logEp ? compileScript(logEp.script, { characters: data.characters, assets: data.assets, startOutfit: logEp.startOutfit, investigations: logEp.investigations }).steps : []),
    [logEp, data.characters, data.assets],
  );

  return (
    <SubPage kind="episodes" eyebrow="Episodes" title="에피소드">
      <div className="book-spread">
        <section className="leaf leaf-left" aria-labelledby="toc-h">
          <h2 id="toc-h" className="leaf-heading">
            <span>Contents</span>
            <small>목차</small>
          </h2>
          <ol className="toc">
            {episodes.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={`toc-row${e.id === ep.id ? ' is-current' : ''}${e.status === 'sealed' ? ' is-sealed' : ''}`}
                  aria-pressed={e.id === ep.id}
                  onClick={() => setSelected(e.id)}
                  onDoubleClick={() => e.status === 'available' && navigate(`episode-${e.id}`)}
                >
                  <span className="toc-num">{e.number}</span>
                  <span className="toc-title">
                    {e.title}
                    {e.test && <em className="test-badge">TEST</em>}
                  </span>
                  <span className="toc-dots" aria-hidden="true" />
                  <span className="toc-state">{e.status === 'available' ? '열람 가능' : '봉인'}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <span className="spine" aria-hidden="true" />

        <section className="leaf leaf-right" aria-live="polite">
          <figure className="ep-plate">
            <img src={assetUrl(ep.thumbnail) ?? assetUrl(`ph:cg:EPISODE ${ep.number}`) ?? ''} alt={`${ep.title} 썸네일`} />
          </figure>
          <p className="ep-number">Episode {ep.number}</p>
          <h2 className="ep-title">{ep.title}</h2>
          {ep.subtitle && <p className="ep-sub">{ep.subtitle}</p>}
          <span className="ornament-rule" aria-hidden="true" />
          {ep.status === 'available' ? (
            <>
              <div className="ep-actions">
                <button type="button" className="seal-btn" onClick={() => navigate(`episode-${ep.id}`)}>
                  처음부터 읽기
                </button>
                {last && (
                  <button
                    type="button"
                    className="seal-btn ghost"
                    onClick={() => { requestStart(ep.id, last.index); navigate(`episode-${ep.id}`); }}
                  >
                    책갈피에서 이어 읽기
                  </button>
                )}
                {(done || isOperatorBrowser()) && (
                  <button type="button" className="seal-btn ghost" onClick={() => setLogFor(ep.id)}>
                    대사 기록
                  </button>
                )}
              </div>
              {!done && <p className="ep-reader-state"><span>끝까지 읽으면 대사 기록에서 원하는 장면으로 바로 갈 수 있습니다</span></p>}
              {(marks > 0 || memo.text.trim()) && (
                <p className="ep-reader-state">
                  {marks > 0 && <span>책갈피 {marks}개 · 최근 {formatTime(last!.savedAt)}</span>}
                  {memo.text.trim() && <span>메모 있음</span>}
                </p>
              )}
            </>
          ) : (
            <p className="sealed-note">원고가 도착하면 열람할 수 있습니다.</p>
          )}
        </section>
      </div>
      {logEp && logSteps.length > 0 && (
        <LogView
          page
          steps={logSteps}
          upTo={logSteps.length - 1}
          current={0}
          investigations={logEp.investigations}
          title={`Episode ${logEp.number} · ${logEp.title}`}
          onClose={() => setLogFor(null)}
          onJump={(i) => { requestStart(logEp.id, i); navigate(`episode-${logEp.id}`); }}
        />
      )}
    </SubPage>
  );
}
