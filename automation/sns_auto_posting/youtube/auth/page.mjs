import { supabase } from './auth-client.mjs';
import { sendMagicLink, currentAuth, beginTotp, verifiedTotpFactor, challengeAndVerify } from './auth-flow.mjs';
import { GATEWAY_URL, MAX_GATEWAY_TEST_VIDEO_BYTES, runGatewaySafetyCheck } from './gateway-check.mjs';
import { SUPABASE_PUBLISHABLE_KEY } from './public-config.mjs';

const $ = id => document.getElementById(id);
const hasValidTestVideo = () => {
  const file = $('gatewayVideo').files?.[0];
  return !!file && file.size > 0 && file.size <= MAX_GATEWAY_TEST_VIDEO_BYTES &&
    file.type === 'video/mp4' && /\.mp4$/i.test(file.name);
};
let factorId = null;
let busy = false;
let gatewayAttempted = false;
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
  $('gatewayVideo').disabled = !state.signedIn || state.aal !== 'aal2' || gatewayAttempted;
  $('gatewayCheck').disabled = !state.signedIn || state.aal !== 'aal2' || gatewayAttempted || !hasValidTestVideo();
  if (!state.signedIn) clearQr();
  if (state.aal === 'aal2') { clearQr(); notice('AAL2を確認しました。検証用Gateway確認が利用できます。動画投稿はできません。'); }
}
$('gatewayVideo').addEventListener('change', () => locked(async () => {
  const state = await currentAuth(supabase.auth);
  $('gatewayVideo').disabled = !state.signedIn || state.aal !== 'aal2' || gatewayAttempted;
  $('gatewayCheck').disabled = !state.signedIn || state.aal !== 'aal2' || gatewayAttempted || !hasValidTestVideo();
  $('gatewayResult').hidden = true;
}));
$('gatewayCheck').addEventListener('click', () => locked(async () => {
  const file = $('gatewayVideo').files?.[0];
  if (!file || gatewayAttempted) return;
  // Re-check immediately before sending; the disabled button is only a UI aid.
  const state = await currentAuth(supabase.auth);
  if (!state.signedIn || state.aal !== 'aal2') {
    await refresh();
    notice('AAL2が必要です。Gatewayへの送信は行っていません。');
    return;
  }
  gatewayAttempted = true;
  $('gatewayVideo').disabled = true;
  $('gatewayCheck').disabled = true;
  const result = await runGatewaySafetyCheck({
    auth: supabase.auth,
    video: file,
    endpoint: GATEWAY_URL,
    origin: window.location.origin,
    publishableKey: SUPABASE_PUBLISHABLE_KEY,
  });
  const box = $('gatewayResult');
  box.replaceChildren();
  const rows = [
    ['HTTP', result.httpStatus === null ? '通信失敗' : String(result.httpStatus)],
    ['状態', result.code || result.status || (result.sent ? '応答を確認できません' : result.reason)],
  ];
  if (result.authorized !== undefined) rows.push(['authorized', String(result.authorized)]);
  if (result.validated !== undefined) rows.push(['validated', String(result.validated)]);
  if (result.privacyStatus) rows.push(['privacyStatus', result.privacyStatus]);
  if (result.requestId) rows.push(['request_id', result.requestId]);
  rows.push(['videoId', result.hasVideoId ? '予期しない応答' : 'なし']);
  for (const [label, value] of rows) {
    const line = document.createElement('p');
    line.textContent = `${label}: ${value}`;
    box.append(line);
  }
  box.hidden = false;
  notice(result.success ? 'Gatewayのvalidation_only確認が完了しました。YouTube投稿は行っていません。' : 'Gateway安全確認は成功しませんでした。追加リクエストは停止しています。');
}));
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
