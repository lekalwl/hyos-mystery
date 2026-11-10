import { useEffect } from 'react';
import type { Step } from '../engine/script';
import { Stage } from '../engine/Stage';
import { audio } from '../engine/audio';
import { assetUrl } from '../content/store';
import type { InvestigationDef } from '../content/types';
import { Hotspots } from '../engine/Hotspots';

/** 16:9 live preview of one step, text fully shown. */
export function Preview({ step, index, total, onIndex, onPlay, sound, onSound, investigations }: {
  step: Step | undefined; index: number; total: number;
  onIndex: (i: number) => void; onPlay?: () => void;
  sound: boolean; onSound: (v: boolean) => void;
  investigations?: InvestigationDef[];
}) {
  const inv = step?.invest ? investigations?.find((i) => i.id === step.invest) : undefined;
  useEffect(() => {
    if (!sound || !step) { audio.playBgm(null); return; }
    audio.playBgm(assetUrl(step.bgm));
    step.se.forEach((s) => audio.playSe(assetUrl(s)));
  }, [step, sound]);
  useEffect(() => () => audio.playBgm(null), []);

  return (
    <section className="ed-preview" aria-label="미리보기">
      <div className="ed-preview-frame">
        {step ? (
          <div className="player is-embedded">
            <div className="vn-stage">
              <Stage
                step={step}
                stepKey={index}
                visibleText={step.text}
                hiddenText=""
                overlay={inv ? <Hotspots inv={inv} preview /> : undefined}
                box={
                  <div className="vn-box is-static">
                    {step.speaker && <span className="vn-name" style={step.speaker.color ? { color: step.speaker.color } : undefined}>{step.speaker.name}</span>}
                    <span className={`vn-text${step.speaker ? '' : ' is-narration'}${step.thought ? ' is-thought' : ''}`}>{step.text}</span>
                    <span className="vn-meta"><span>{index + 1} / {total}</span></span>
                  </div>
                }
              />
            </div>
          </div>
        ) : (
          <p className="ed-empty">대사나 해설 줄을 쓰면 여기에 장면이 보입니다.</p>
        )}
      </div>
      <div className="ed-preview-bar">
        <button type="button" className="text-btn light" onClick={() => onIndex(Math.max(0, index - 1))} disabled={index <= 0}>◀ 이전</button>
        <span className="ed-count">{total ? `${index + 1} / ${total}` : '0 / 0'}</span>
        <button type="button" className="text-btn light" onClick={() => onIndex(Math.min(total - 1, index + 1))} disabled={index >= total - 1}>다음 ▶</button>
        <label className="ed-check"><input type="checkbox" checked={sound} onChange={(e) => onSound(e.target.checked)} /> 소리</label>
        {onPlay && <button type="button" className="seal-btn small" onClick={onPlay} disabled={!total}>여기서부터 플레이</button>}
      </div>
    </section>
  );
}
