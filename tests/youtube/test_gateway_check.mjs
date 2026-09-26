import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_UI_ORIGIN, GATEWAY_URL, runGatewaySafetyCheck } from '../../automation/sns_auto_posting/youtube/auth/gateway-check.mjs';

const publishableKey = 'sb_publishable_test_only';
const sessionToken = 'TEST_SESSION_TOKEN_MUST_NOT_ESCAPE';
const validFile = () => new File([new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112])], 'check.mp4', { type: 'video/mp4' });
function auth(aal, calls = []) {
  return {
    getUser: async () => ({ data: { user: { id: 'synthetic-test-user' } } }),
    mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: aal, nextLevel: 'aal2' } }) },
    getSession: async () => { calls.push('getSession'); return { data: { session: { access_token: sessionToken } } }; },
  };
}

test('AAL1 and unauthenticated state never fetch or retrieve the session token', async () => {
  let requests = 0;
  const fetchImpl = async () => { requests++; throw new Error('must not run'); };
  for (const level of ['aal1', 'none']) {
    const calls = [];
    const result = await runGatewaySafetyCheck({ auth: auth(level, calls), video: validFile(), publishableKey, fetchImpl });
    assert.equal(result.sent, false);
    assert.equal(result.reason, 'aal2_required');
    assert.deepEqual(calls, []);
  }
  assert.equal(requests, 0);
});

test('AAL2 request uses the gateway URL, internal Bearer token, UUID key and multipart validation payload', async () => {
  let captured;
  const result = await runGatewaySafetyCheck({
    auth: auth('aal2'), video: validFile(), publishableKey, origin: AUTH_UI_ORIGIN,
    makeIdempotencyKey: () => '11111111-1111-4111-8111-111111111111',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ success: true, status: 'validation_only', authorized: true,
        validated: true, privacyStatus: 'private', request_id: '22222222-2222-4222-8222-222222222222' }),
      { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });
  assert.equal(captured.url, GATEWAY_URL);
  assert.equal(GATEWAY_URL, 'https://nmkcjtrllzkwjxmjromw.supabase.co/functions/v1/youtube-upload-gateway');
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.headers.apikey, publishableKey);
  assert.equal(captured.options.headers.authorization, `Bearer ${sessionToken}`);
  assert.match(captured.options.headers['Idempotency-Key'], /^[0-9a-f-]{36}$/i);
  assert.equal(captured.options.credentials, 'omit');
  assert.equal(captured.options.body.get('title'), 'Phase 2-B3 validation-only check');
  assert.equal(captured.options.body.get('video').name, 'check.mp4');
  assert.equal(result.success, true);
  assert.equal(result.status, 'validation_only');
  assert.equal(result.authorized, true);
  assert.equal(result.validated, true);
  assert.equal(result.privacyStatus, 'private');
  assert.equal(result.hasVideoId, false);
  assert.equal(JSON.stringify(result).includes(sessionToken), false);
});

test('each normal request gets a newly generated UUID idempotency key', async () => {
  const keys = [];
  for (let i = 0; i < 2; i++) {
    await runGatewaySafetyCheck({ auth: auth('aal2'), video: validFile(), publishableKey, origin: AUTH_UI_ORIGIN,
      fetchImpl: async (_, options) => {
        keys.push(options.headers['Idempotency-Key']);
        return new Response(JSON.stringify({ success: false, code: 'duplicate_request' }), { status: 409 });
      } });
  }
  assert.equal(keys.every(key => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(key)), true);
  assert.notEqual(keys[0], keys[1]);
});

test('oversize, wrong MIME or missing test video do not send requests', async () => {
  let requests = 0;
  const fetchImpl = async () => { requests++; throw new Error('must not run'); };
  for (const video of [null, new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.mp4', { type: 'video/mp4' }),
    new File(['x'], 'wrong.mp4', { type: 'application/octet-stream' })]) {
    const result = await runGatewaySafetyCheck({ auth: auth('aal2'), video, publishableKey, origin: AUTH_UI_ORIGIN, fetchImpl });
    assert.equal(result.sent, false);
    assert.equal(result.reason, 'invalid_test_video');
  }
  assert.equal(requests, 0);
});

test('error bodies are reduced to safe fields and videoId can never count as success', async () => {
  const rawSecret = 'RAW_PROVIDER_RESPONSE_CANARY';
  const result = await runGatewaySafetyCheck({ auth: auth('aal2'), video: validFile(), publishableKey, origin: AUTH_UI_ORIGIN,
    fetchImpl: async () => new Response(JSON.stringify({ success: true, status: 'validation_only', authorized: true,
      validated: true, privacyStatus: 'private', videoId: 'should-not-display', raw: rawSecret }), { status: 200 }) });
  assert.equal(result.success, false);
  assert.equal(result.hasVideoId, true);
  assert.equal(result.code, 'unexpected_response_shape');
  assert.doesNotMatch(JSON.stringify(result), new RegExp(rawSecret));
  assert.doesNotMatch(JSON.stringify(result), /should-not-display/);
});

test('request is not sent from another origin or to another endpoint', async () => {
  let requests = 0;
  const fetchImpl = async () => { requests++; throw new Error('must not run'); };
  for (const overrides of [{ origin: 'https://example.invalid' }, { endpoint: 'https://example.invalid/gateway' }]) {
    const result = await runGatewaySafetyCheck({ auth: auth('aal2'), video: validFile(), publishableKey,
      origin: AUTH_UI_ORIGIN, fetchImpl, ...overrides });
    assert.equal(result.sent, false);
    assert.equal(result.reason, 'origin_or_endpoint_denied');
  }
  assert.equal(requests, 0);
});

test('UI gates the test control and the normal posting button remains disabled', async () => {
  const { readFileSync } = await import('node:fs');
  const { URL } = await import('node:url');
  const root = new URL('../../automation/sns_auto_posting/youtube/', import.meta.url);
  const html = readFileSync(new URL('auth/index.html', root), 'utf8');
  const page = readFileSync(new URL('auth/page.mjs', root), 'utf8');
  const helper = readFileSync(new URL('auth/gateway-check.mjs', root), 'utf8');
  const creatorHtml = readFileSync(new URL('index.html', root), 'utf8');
  const creatorJs = readFileSync(new URL('creator-studio.js', root), 'utf8');
  assert.match(html, /id="gatewayCheck"[^>]*disabled/);
  assert.match(html, /id="gatewayVideo"[^>]*disabled/);
  assert.match(page, /state\.aal !== 'aal2'/);
  assert.match(page, /origin: window\.location\.origin/);
  assert.match(page, /gatewayAttempted/);
  assert.doesNotMatch(page + helper, /console\.|localStorage|sessionStorage/);
  assert.match(creatorHtml, /id="postButton"[^>]*disabled/);
  assert.doesNotMatch(creatorHtml + creatorJs, /youtube-upload-gateway|x-fieldrise-upload-secret/i);
});
