/**
 * Editor lock.
 * SHA-256 of the operator passcode. Change it with:
 *   npm run passcode -- 새비밀번호
 * The public build (npm run build:public) leaves the editor out entirely,
 * so visitors to the public site have nothing to unlock.
 */
export const EDITOR_PASSCODE_SHA256 = '630f170185e7b007ff4359954fe7c2383964429961d82b09022032411937194c';
