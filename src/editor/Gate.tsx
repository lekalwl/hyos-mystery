import { useState } from 'react';
import { EDITOR_PASSCODE_SHA256 } from '../config';
import { navigate } from '../lib/router';

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if ((await sha256(code)) === EDITOR_PASSCODE_SHA256) onUnlock();
      else setError('비밀번호가 맞지 않습니다.');
    } catch {
      setError('이 주소에서는 잠금을 확인할 수 없습니다. https 또는 localhost에서 여세요.');
    }
  };
  return (
    <div className="ed-gate">
      <form className="ed-gate-card" onSubmit={submit}>
        <p className="eyebrow">Operator</p>
        <h1>편집기</h1>
        <p className="ed-gate-note">운영자 비밀번호를 입력하세요.</p>
        <label htmlFor="ed-pass" className="sr-only">비밀번호</label>
        <input id="ed-pass" type="password" autoFocus value={code} onChange={(e) => { setCode(e.target.value); setError(''); }} autoComplete="current-password" />
        {error && <p className="ed-error" role="alert">{error}</p>}
        <div className="ed-row">
          <button type="button" className="text-btn light" onClick={() => navigate('')}>사이트로</button>
          <button type="submit" className="seal-btn small">열기</button>
        </div>
      </form>
    </div>
  );
}
