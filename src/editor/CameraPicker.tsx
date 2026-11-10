import { useEffect, useRef, useState } from 'react';
import { CAMERA_HOME, clampCamera, type Step } from '../engine/script';
import { CAMERA_SPEEDS } from '../engine/vocab';
import { Stage } from '../engine/Stage';

/** Click on the scene to choose where the camera looks, then set the zoom. */
export function CameraPicker({ step, onInsert, onClose }: {
  step: Step | undefined;
  onInsert: (line: string) => void;
  onClose: () => void;
}) {
  const start = step?.camera && step.camera.zoom > 1 ? step.camera : { ...CAMERA_HOME, zoom: 2 };
  const [cam, setCam] = useState(() => clampCamera({ ...start, x: start.x, y: start.y }));
  const [speed, setSpeed] = useState('normal');
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setFrom = (e: React.PointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setCam((c) => clampCamera({ ...c, x, y }));
  };
  const r1 = (v: number) => Math.round(v);
  const z = Math.round(cam.zoom * 10) / 10;
  const sp = CAMERA_SPEEDS.find((s) => s.key === speed)!;
  const line = z <= 1 ? `@카메라 전체${speed !== 'normal' ? ` #${sp.names[0]}` : ''}` : `@카메라 ${r1(cam.x)} ${r1(cam.y)} ${z}${speed !== 'normal' ? ` #${sp.names[0]}` : ''}`;
  const base: Step | undefined = step && { ...step, camera: { ...CAMERA_HOME, ms: 0 }, narr: null, fx: [], se: [] };
  const shot: Step | undefined = step && { ...step, camera: { ...cam, zoom: z, ms: 250 }, narr: null, fx: [], se: [] };
  const vw = 100 / Math.max(1, z);

  return (
    <div className="ed-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ed-modal is-wide" role="dialog" aria-modal="true" aria-label="카메라 위치 고르기">
        <header className="ed-modal-head">
          <h3>카메라 위치 고르기</h3>
          <span className="ed-help">왼쪽 화면을 누르거나 끌어서 비출 곳을 고르세요.</span>
          <button type="button" className="text-btn light" onClick={onClose}>닫기</button>
        </header>
        <div className="ed-cam-grid">
          <div
            ref={frame}
            className="ed-cam-frame"
            onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setFrom(e); }}
            onPointerMove={(e) => { if (dragging.current) setFrom(e); }}
            onPointerUp={() => { dragging.current = false; }}
          >
            {base && <div className="player is-embedded"><div className="vn-stage"><Stage step={base} stepKey="cam-base" visibleText="" hiddenText="" box={null} /></div></div>}
            <div className="ed-cam-view" style={{ left: `${cam.x - vw / 2}%`, top: `${cam.y - vw / 2}%`, width: `${vw}%`, height: `${vw}%` }} />
          </div>
          <div className="ed-cam-frame is-result" aria-label="카메라 결과">
            {shot && <div className="player is-embedded"><div className="vn-stage"><Stage step={shot} stepKey="cam-shot" visibleText="" hiddenText="" box={null} /></div></div>}
          </div>
        </div>
        <footer className="ed-modal-foot">
          <label className="ed-row">배율
            <input type="range" min={1} max={4} step={0.1} value={z} onChange={(e) => setCam((c) => clampCamera({ ...c, zoom: Number(e.target.value) }))} />
            <strong>{z.toFixed(1)}×</strong>
          </label>
          <label className="ed-row">속도
            <select className="ed-input" value={speed} onChange={(e) => setSpeed(e.target.value)}>
              {CAMERA_SPEEDS.map((s) => <option key={s.key} value={s.key}>{s.names[0]} · {s.desc}</option>)}
            </select>
          </label>
          <code>{line}</code>
          <button type="button" className="seal-btn small" onClick={() => { onInsert(line); onClose(); }}>대본에 넣기</button>
        </footer>
      </div>
    </div>
  );
}
