// Usage: npm run passcode -- 새비밀번호
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const code = process.argv.slice(2).join(' ').trim();
if (!code) { console.error('사용법: npm run passcode -- 새비밀번호'); process.exit(1); }
const file = new URL('../src/config.ts', import.meta.url);
const src = readFileSync(file, 'utf8');
const hash = createHash('sha256').update(code).digest('hex');
writeFileSync(file, src.replace(/EDITOR_PASSCODE_SHA256 = '[0-9a-f]+'/, `EDITOR_PASSCODE_SHA256 = '${hash}'`));
console.log('편집기 비밀번호를 바꿨습니다. 다시 빌드하세요.');
