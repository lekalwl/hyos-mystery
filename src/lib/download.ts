/**
 * Save a generated file to the viewer's device.
 * Inside the claude.ai artifact viewer, plain download links are blocked,
 * so we go through its `downloads` capability (the viewer confirms).
 * Everywhere else (own hosting, npm run dev) a normal download link works.
 */
type Result = 'saved' | 'declined' | 'unavailable';
/** last failure code from the viewer, for the message */
export let lastSaveError = '';

interface DownloadsNs { save(r: { filename: string; data: Blob }): Promise<unknown> }
interface ClaudeHost { use?: (name: string) => Promise<unknown> }

const inArtifact = () => {
  try { return window.self !== window.top && !!(window as unknown as { claude?: ClaudeHost }).claude?.use; } catch { return true; }
};

export async function saveFile(blob: Blob, filename: string): Promise<Result> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  lastSaveError = '';
  if (host?.use) {
    const dl = (await host.use('downloads').catch(() => null)) as DownloadsNs | null;
    if (dl) {
      try { await dl.save({ filename, data: blob }); lastSaveError = ''; return 'saved'; }
      catch (e) {
        lastSaveError = (e as { code?: string })?.code ?? 'unknown';
        return lastSaveError === 'declined' ? 'declined' : 'unavailable';
      }
    }
    if (inArtifact()) { lastSaveError = 'no_downloads'; return 'unavailable'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}

export const SAVE_MESSAGES: Record<Result, string> = {
  saved: '저장했습니다. 브라우저의 「다운로드」 폴더를 확인하세요.',
  declined: '저장을 취소했습니다.',
  unavailable: '이 화면에서는 파일을 저장하지 못했습니다.',
};
