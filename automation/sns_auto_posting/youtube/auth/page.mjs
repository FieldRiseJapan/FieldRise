import { supabase } from './auth-client.mjs';
import { sendMagicLink, currentAuth, beginTotp, verifiedTotpFactor, challengeAndVerify } from './auth-flow.mjs';

const $ = id => document.getElementById(id);
let factorId = null;
let busy = false;
const notice = text => { $('notice').textContent = text; };
const clearQr = () => {
  $('qr').removeAttribute('src');
  $('qrContainer').hidden = true;
  $('totpCode').value = '';
  factorId = null;
};
async function locked(action) {
  if (busy) return;
  busy = true;
  try { await action(); } catch { notice('処理できませんでした。時間をおいて再試行してください。'); }
  finally { busy = false; }
}
async function refresh() {
  const state = await currentAuth(supabase.auth);
  $('sessionState').textContent = state.signedIn ? 'ログイン済み' : '未ログイン';
  $('aalState').textContent = `AAL: ${state.aal}`;
  $('enroll').disabled = !state.signedIn || state.aal === 'aal2';
  $('verify').disabled = !state.signedIn || state.aal === 'aal2';
  if (!state.signedIn) clearQr();
  if (state.aal === 'aal2') { clearQr(); notice('AAL2を確認しました。動画投稿はまだできません。'); }
}
async function send(initialRegistration) {
  await locked(async () => {
    const ok = await sendMagicLink(supabase.auth, $('email').value, window.location.href, initialRegistration);
    // Do not reveal whether an address already exists.
    notice(ok ? 'メールを確認してください。リンクはこのブラウザで開いてください。' : '送信できませんでした。入力と設定を確認してください。');
    $('email').value = '';
  });
}
$('signIn').addEventListener('click', () => send(false));
$('firstRegistration').addEventListener('click', () => send(true));
$('refresh').addEventListener('click', () => locked(refresh));
$('signOut').addEventListener('click', () => locked(async () => {
  const { error } = await supabase.auth.signOut();
  if (error) { notice('サインアウトできませんでした。再試行してください。'); return; }
  clearQr();
  await refresh();
  notice('サインアウトしました。');
}));
$('enroll').addEventListener('click', () => locked(async () => {
  const state = await currentAuth(supabase.auth);
  if (!state.signedIn || state.aal === 'aal2') return;
  const enrollment = await beginTotp(supabase.auth);
  if (!enrollment) { notice('TOTP登録を開始できませんでした。'); return; }
  factorId = enrollment.factorId;
  $('qr').src = enrollment.qr;
  $('qrContainer').hidden = false;
  notice('AuthenticatorでQRを読み取り、コードを検証してください。');
}));
$('verify').addEventListener('click', () => locked(async () => {
  const state = await currentAuth(supabase.auth);
  if (!state.signedIn || state.aal === 'aal2') return;
  const id = factorId || await verifiedTotpFactor(supabase.auth);
  const ok = await challengeAndVerify(supabase.auth, id, $('totpCode').value);
  $('totpCode').value = '';
  if (!ok) { notice('コードを検証できませんでした。再度お試しください。'); return; }
  clearQr();
  await refresh();
  const after = await currentAuth(supabase.auth);
  if (after.aal !== 'aal2') notice('検証後のAAL2を確認できませんでした。');
}));
await locked(refresh);
