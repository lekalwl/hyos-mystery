import { useEffect, useRef, useState } from 'react';
import { getContent, isOperatorBrowser, OPERATOR_FLAG, updateContent, useContent, loadContent, usePublishedContent } from '../content/store';
import { navigate } from '../lib/router';
import { Gate } from './Gate';
import { ScriptTab } from './ScriptTab';
import { LibraryTab } from './LibraryTab';
import { CharactersTab } from './CharactersTab';
import { EpisodesTab } from './EpisodesTab';
import { HelpTab } from './HelpTab';
import { RulesTab } from './RulesTab';
import { InvestigationTab } from './InvestigationTab';
import { exportZip, importFile } from './assets';
import { saveFile, SAVE_MESSAGES, lastSaveError } from '../lib/download';
import { handoffAvailable, sendToClaude } from '../lib/handoff';
import '../styles/editor.css';

const useContentDismiss = () => updateContent((d) => d); // touching the draft makes it the newest

type Tab = 'script' | 'invest' | 'library' | 'chars' | 'episodes' | 'rules' | 'help';
const TABS: { id: Tab; label: string }[] = [
  { id: 'script', label: '대본' },
  { id: 'invest', label: '조사' },
  { id: 'library', label: '라이브러리' },
  { id: 'chars', label: '인물' },
  { id: 'episodes', label: '에피소드' },
  { id: 'rules', label: '규칙' },
  { id: 'help', label: '태그 도움말' },
];

export default function EditorApp() {
  const [unlocked, setUnlocked] = useState(isOperatorBrowser);
  const { data, source, ready, newerPublished } = useContent();
  const [confirmPub, setConfirmPub] = useState(false);
  const [tab, setTab] = useState<Tab>('script');
  const [epId, setEpId] = useState(data.episodes[0]?.id ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'changes' | 'all' | 'send' | null>(null);
  const [canSend, setCanSend] = useState(false);
  useEffect(() => { handoffAvailable().then(setCanSend); }, []);
  const runSend = async () => {
    setBusy('send'); setBusyText('준비 중…');
    try {
      const blob = await exportZip('changes', (d, t) => setBusyText(t ? `담는 중 ${d}/${t}` : '담는 중…'));
      const d = getContent().data;
      const eps = d.episodes.map((e) => `EP${e.number} ${e.title}`).join(', ');
      const r = await sendToClaude(blob, { episodes: eps, updatedAt: d.updatedAt }, (i, t) => setBusyText(`보내는 중 ${i}/${t}`));
      flash(`Claude에게 보냈습니다 (${(r.size / 1048576).toFixed(1)}MB, ${new Date().toLocaleTimeString('ko-KR')}). 대화창에 「보냈어」라고만 하면 됩니다.`);
    } catch (e) {
      const code = (e as { code?: string }).code;
      flash(`보내기 실패${code ? ` (${code})` : ''}: ${(e as Error).message}`);
    } finally { setBusy(null); }
  };
  const [busyText, setBusyText] = useState('');

  // first unlock: reload so this browser switches to its draft (or makes one)
  const unlock = async () => {
    try { localStorage.setItem(OPERATOR_FLAG, '1'); } catch { /* ignore */ }
    await loadContent();
    setUnlocked(true);
  };
  useEffect(() => {
    if (unlocked && ready && getContent().source !== 'draft') updateContent((d) => d);
  }, [unlocked, ready]);

  if (!unlocked) return <Gate onUnlock={unlock} />;

  const ep = data.episodes.find((e) => e.id === epId) ?? data.episodes[0];
  const flash = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(null), 7000); };
  const runExport = async (mode: 'changes' | 'all') => {
    setBusy(mode); setBusyText('준비 중…');
    try {
      const blob = await exportZip(mode, (d, t) => setBusyText(t ? `담는 중 ${d}/${t}` : '담는 중…'));
      const mb = (blob.size / 1048576).toFixed(1);
      const r = await saveFile(blob, `grayhaven-${mode === 'all' ? 'backup' : 'content'}-${new Date().toISOString().slice(0, 10)}.zip`);
      flash(r === 'saved'
        ? `${SAVE_MESSAGES.saved} (${mb}MB) ${mode === 'changes' ? '사이트에 이미 있는 파일은 빼고 바뀐 것만 담았습니다. 이 zip 링크를 주시면 사이트에 반영합니다.' : '모든 파일을 담은 전체 백업입니다.'}`
        : `${SAVE_MESSAGES[r]}${lastSaveError ? ` (${lastSaveError})` : ''}${r === 'unavailable' && canSend ? ' 대신 「Claude에게 보내기」를 쓰면 다운로드 없이 바로 넘어옵니다.' : ''}`);
    } catch (e) { flash(`내보내기 실패: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  return (
    <div className="editor">
      <header className="ed-top">
        <div className="ed-brand"><span>Grayhaven</span> 편집기</div>
        <label className="sr-only" htmlFor="ed-ep">에피소드</label>
        <select id="ed-ep" className="ed-input" value={ep?.id} onChange={(e) => setEpId(e.target.value)}>
          {data.episodes.map((e) => <option key={e.id} value={e.id}>EP {e.number} · {e.title}{e.status === 'sealed' ? ' (봉인)' : ''}</option>)}
        </select>
        <span className="ed-saved">{source === 'draft' ? '이 브라우저에 자동 저장됨' : '불러오는 중'}</span>
        <div className="ed-top-actions">
          {canSend && <button type="button" className="seal-btn small" disabled={!!busy} title="내보내기 파일을 다운로드 없이 Claude에게 바로 넘깁니다" onClick={runSend}>{busy === 'send' ? busyText : 'Claude에게 보내기'}</button>}
          <button type="button" className="text-btn light" disabled={!!busy} title="사이트에 아직 없는 파일과 대본·설정만 담습니다 (빠름)" onClick={() => runExport('changes')}>{busy === 'changes' ? busyText : '내보내기'}</button>
          <button type="button" className="text-btn light" disabled={!!busy} title="모든 이미지·음악까지 담은 전체 백업 (느림)" onClick={() => runExport('all')}>{busy === 'all' ? busyText : '전체 백업'}</button>
          <button type="button" className="text-btn light" onClick={() => importRef.current?.click()}>가져오기</button>
          <button type="button" className="text-btn light" onClick={() => setConfirmPub(true)}>사이트 버전 불러오기</button>
          <button type="button" className="text-btn light" onClick={() => navigate('')}>사이트 보기</button>
          <button type="button" className="text-btn light" onClick={() => { try { localStorage.removeItem(OPERATOR_FLAG); } catch { /* */ } location.hash = ''; location.reload(); }}>잠그기</button>
        </div>
        <input ref={importRef} type="file" accept=".zip,.json" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = '';
          if (!f) return;
          try { await importFile(f); flash('가져왔습니다.'); } catch (err) { flash(`가져오기 실패: ${(err as Error).message}`); }
        }} />
      </header>

      <nav className="ed-tabs" role="tablist" aria-label="편집 영역">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>

      {msg && <p className="ed-msg" role="status">{msg}</p>}

      {(newerPublished || confirmPub) && (
        <div className="ed-banner" role="alert">
          <p>
            {newerPublished
              ? <>사이트에 이 브라우저의 편집본보다 <strong>최신 버전</strong>이 올라와 있습니다 ({new Date(newerPublished.updatedAt).toLocaleString('ko-KR')}). 이 브라우저 편집본: {new Date(data.updatedAt).toLocaleString('ko-KR')}.</>
              : <>사이트에 올라가 있는 버전을 불러옵니다.</>}
            {' '}불러오면 이 브라우저의 편집본은 사라집니다. 필요하면 먼저 「내보내기」로 백업하세요.
          </p>
          <div className="ed-row">
            <button type="button" className="text-btn light" onClick={async () => {
              try { await saveFile(await exportZip('all'), `grayhaven-backup-${new Date().toISOString().slice(0, 10)}.zip`); } catch { /* ignore */ }
            }}>지금 편집본 백업</button>
            <button type="button" className="seal-btn small" onClick={async () => {
              const ok = await usePublishedContent();
              setConfirmPub(false);
              flash(ok ? '사이트 버전을 불러왔습니다.' : '사이트 버전을 불러오지 못했습니다.');
            }}>사이트 버전 불러오기</button>
            <button type="button" className="text-btn light" onClick={() => { setConfirmPub(false); if (newerPublished) useContentDismiss(); }}>지금 편집본 유지</button>
          </div>
        </div>
      )}

      <main className="ed-main">
        {tab === 'script' && (ep ? <ScriptTab key={ep.id} ep={ep} data={data} /> : <p className="ed-empty">에피소드 탭에서 에피소드를 추가하세요.</p>)}
        {tab === 'invest' && (ep ? <InvestigationTab key={ep.id} ep={ep} data={data} /> : <p className="ed-empty">에피소드를 먼저 추가하세요.</p>)}
        {tab === 'library' && <LibraryTab data={data} />}
        {tab === 'chars' && <CharactersTab data={data} />}
        {tab === 'episodes' && <EpisodesTab data={data} current={ep?.id ?? ''} onSelect={setEpId} />}
        {tab === 'rules' && <RulesTab data={data} />}
        {tab === 'help' && <HelpTab />}
      </main>
    </div>
  );
}
