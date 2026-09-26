import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { callbackUrl, sendMagicLink, currentAuth, beginTotp, verifiedTotpFactor, challengeAndVerify, establishCallback } from '../../automation/sns_auto_posting/youtube/auth/auth-flow.mjs';

const root = new URL('../../automation/sns_auto_posting/youtube/', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('Magic Link uses the exact callback and does not create a user on normal login', async () => {
  let sent;
  const auth = { signInWithOtp: async input => { sent = input; return { error: null }; } };
  assert.equal(await sendMagicLink(auth, ' person@example.test ', 'https://fieldrisejapan.github.io/FieldRise/automation/sns_auto_posting/youtube/auth/index.html'), true);
  assert.deepEqual(sent, { email: 'person@example.test', options: {
    emailRedirectTo: 'https://fieldrisejapan.github.io/FieldRise/automation/sns_auto_posting/youtube/auth/callback.html',
    shouldCreateUser: false,
  } });
  assert.equal(callbackUrl('https://fieldrisejapan.github.io/FieldRise/automation/sns_auto_posting/youtube/auth/'), sent.options.emailRedirectTo);
  assert.equal(await sendMagicLink(auth, 'invalid', 'https://example.test/'), false);
});

test('only explicit first registration allows user creation', async () => {
  let sent;
  const auth = { signInWithOtp: async input => { sent = input; return { error: null }; } };
  assert.equal(await sendMagicLink(auth, 'person@example.test', 'https://example.test/auth/index.html', true), true);
  assert.equal(sent.options.shouldCreateUser, true);
});

test('AAL comes from Supabase MFA state for an authenticated user', async () => {
  const auth = { getUser: async () => ({ data: { user: { id: 'hidden' } } }), mfa: {
    getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal2', nextLevel: 'aal2' } }),
  } };
  assert.deepEqual(await currentAuth(auth), { signedIn: true, aal: 'aal2', next: 'aal2' });
  assert.deepEqual(await currentAuth({ getUser: async () => ({ data: { user: null } }) }), { signedIn: false, aal: 'none', next: 'none' });
});

test('TOTP enrollment and challenge verify use SDK without exposing seed', async () => {
  const calls = [];
  const auth = { mfa: {
    enroll: async input => { calls.push(input); return { data: { id: 'factor', totp: { qr_code: 'data:image/svg+xml;base64,PHN2Zz4=', secret: 'never-export' } } }; },
    challenge: async input => { calls.push(input); return { data: { id: 'challenge' } }; },
    verify: async input => { calls.push(input); return { error: null }; },
    listFactors: async () => ({ data: { totp: [{ id: 'factor', status: 'verified' }] } }),
  } };
  assert.deepEqual(await beginTotp(auth), { factorId: 'factor', qr: 'data:image/svg+xml;base64,PHN2Zz4=' });
  assert.equal(await verifiedTotpFactor(auth), 'factor');
  assert.equal(await challengeAndVerify(auth, 'factor', '123456'), true);
  assert.deepEqual(calls, [{ factorType: 'totp' }, { factorId: 'factor' }, { factorId: 'factor', challengeId: 'challenge', code: '123456' }]);
  assert.equal(await challengeAndVerify(auth, 'factor', 'bad'), false);
});

test('callback consumes session and scrubs fragment/query from history even on error', async () => {
  const history = { replaceState: (...args) => { assert.deepEqual(args, [null, '', '/FieldRise/automation/sns_auto_posting/youtube/auth/callback.html']); } };
  const location = { pathname: '/FieldRise/automation/sns_auto_posting/youtube/auth/callback.html', hash: '#access_token=hidden', search: '?code=hidden' };
  assert.equal(await establishCallback({ getSession: async () => ({ data: { session: {} } }) }, location, history), true);
  await assert.rejects(establishCallback({ getSession: async () => { throw Error('raw credential'); } }, location, history));
});

test('auth UI is separate from upload and public config contains only publishable key', () => {
  const html = read('auth/index.html');
  const page = read('auth/page.mjs');
  const client = read('auth/auth-client.mjs');
  const config = read('auth/public-config.mjs');
  const posting = read('index.html');
  assert.match(html, /id="firstRegistration"/);
  assert.match(html, /id="signOut"/);
  assert.match(html, /id="qr"/);
  assert.doesNotMatch(html + page + client + config, /youtube-upload|youtube-upload-gateway|YOUTUBE_UPLOAD_SECRET|YOUTUBE_GATEWAY_ALLOWED_USER_ID|service_role|google.*token/i);
  assert.match(config, /sb_publishable_/);
  assert.doesNotMatch(config, /sb_secret_|eyJ[A-Za-z0-9_-]{30,}/);
  assert.match(posting, /id="postButton"[^>]*disabled/);
  assert.doesNotMatch(page, /console\.|localStorage|sessionStorage/);
});
