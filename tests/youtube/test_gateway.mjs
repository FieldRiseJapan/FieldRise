import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../../supabase/functions/youtube-upload-gateway/handler.mjs';
import { ALLOWED_ORIGIN } from '../../supabase/functions/youtube-upload-gateway/policy.mjs';

const OWNER = '11111111-1111-4111-8111-111111111111'; // synthetic test ID, never a real allowlist
const OTHER = '22222222-2222-4222-8222-222222222222';
const KEY = '33333333-3333-4333-8333-333333333333';
const allowed = { sub: OWNER, role: 'authenticated', is_anonymous: false, aal: 'aal2' };
const tokenCanary = 'CANARY_PRIVATE_CREDENTIAL';
function setup(claims = allowed, overrides = {}) {
  const events = []; const calls = [];
  const handler = createHandler({ allowedUserId: OWNER,
    verifyJwt: async (jwt) => { if (jwt !== 'valid') throw new Error(tokenCanary); return claims; },
    reserve: async (user, key) => { calls.push([user, key]); return 'reserved'; },
    finish: async () => 'validated',
    log: { error: (...args) => events.push(args) }, ...overrides });
  return { handler, events, calls };
}
function request(parts = [['video', new File(['1234'], 'sample.mp4', { type: 'video/mp4' })], ['title', 'Title']],
  headers = {}, method = 'POST') {
  const form = new FormData();
  for (const [name, value] of parts) form.append(name, value);
  return new Request('https://example.supabase.co/functions/v1/youtube-upload-gateway',
    { method, headers: { origin: ALLOWED_ORIGIN, authorization: 'Bearer valid', 'Idempotency-Key': KEY, ...headers },
      ...(method === 'POST' ? { body: form } : {}) });
}
async function status(req, claims = allowed, overrides = {}) {
  const { handler, calls } = setup(claims, overrides);
  const res = await handler(req);
  return { res, body: res.status === 204 ? null : await res.json(), calls };
}

test('missing and invalid JWT reject before DB', async () => {
  for (const auth of ['', 'Bearer invalid']) {
    const result = await status(request(undefined, { authorization: auth }));
    assert.equal(result.res.status, 401); assert.equal(result.calls.length, 0);
  }
});
test('role, subject, anonymous and aal1 are all rejected', async () => {
  for (const claims of [{ ...allowed, role: 'anon' }, { ...allowed, sub: OTHER },
    { ...allowed, is_anonymous: true }, { ...allowed, aal: 'aal1' }]) {
    const result = await status(request(), claims);
    assert.equal(result.res.status, 403); assert.equal(result.calls.length, 0);
  }
});
test('AAL2 owner is validated, always private, without video ID', async () => {
  const { res, body, calls } = await status(request());
  assert.equal(res.status, 200); assert.equal(body.privacyStatus, 'private');
  assert.equal(body.status, 'validation_only');
  assert.equal(body.authorized, true); assert.equal(body.validated, true);
  assert.equal('videoId' in body, false); assert.equal(calls.length, 1);
  assert.equal(res.headers.get('cache-control'), 'no-store');
});
test('origin and method rejection; preflight allows exact origin only', async () => {
  assert.equal((await status(request(undefined, { origin: 'https://evil.example' }))).res.status, 403);
  const opt = await status(new Request('https://example.supabase.co/functions/v1/youtube-upload-gateway',
    { method: 'OPTIONS', headers: { origin: ALLOWED_ORIGIN, 'Access-Control-Request-Method': 'POST' } }));
  assert.equal(opt.res.status, 204);
  assert.equal(opt.res.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
  assert.equal((await status(request(undefined, {}, 'GET'))).res.status, 405);
});
test('metadata and multipart structure reject invalid requests', async () => {
  const file = new File(['1234'], 'sample.mp4', { type: 'video/mp4' });
  for (const parts of [
    [['video', file], ['title', '  ']], [['video', file], ['title', 'x'.repeat(101)]],
    [['video', file], ['title', 'ok'], ['description', 'あ'.repeat(1667)]],
    [['title', 'ok']], [['video', file], ['video', file], ['title', 'ok']],
    [['video', file], ['title', 'ok'], ['privacyStatus', 'public']],
    [['video', file], ['title', 'ok'], ['unknown', 'x']]]) {
    const result = await status(request(parts));
    assert.equal(result.res.status, 422); assert.equal(result.calls.length, 0);
  }
  assert.equal((await status(request(undefined, { 'Idempotency-Key': '' }))).res.status, 400);
});
test('phase 1 size is small and checked without relying on Content-Length', async () => {
  const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'sample.mp4', { type: 'video/mp4' });
  assert.equal((await status(request([['video', file], ['title', 'ok']]))).res.status, 413);
});
test('database duplicate, concurrency and rate limit decisions fail closed', async () => {
  for (const [result, expected] of [['duplicate', 409], ['busy', 409], ['rate_limited', 429], ['unavailable', 503]]) {
    assert.equal((await status(request(), allowed, { reserve: async () => result })).res.status, expected);
  }
});
test('same idempotency key is accepted only once through a stateful reservation', async () => {
  const keys = new Set();
  const { handler } = setup(allowed, { reserve: async (_, key) => {
    if (keys.has(key)) return 'duplicate';
    keys.add(key); return 'reserved';
  } });
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request())).status, 409);
  assert.equal(keys.size, 1);
});
test('credential-like errors never appear in response or log', async () => {
  const events = [];
  const { handler } = setup(allowed, { reserve: async () => { throw Error(tokenCanary); },
    log: { error: (...args) => events.push(args) } });
  const res = await handler(request());
  assert.equal(res.status, 503);
  assert.doesNotMatch(JSON.stringify(await res.json()) + JSON.stringify(events), /CANARY_PRIVATE_CREDENTIAL/);
});
