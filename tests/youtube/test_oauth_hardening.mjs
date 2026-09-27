import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_ORIGIN,
  OAUTH_REDIRECT_URI,
  OAUTH_SCOPES,
  createCallbackHandler,
  createGoogleProvider,
  createStartHandler,
  hashState,
  transactionTtlSeconds,
  validateGrantedScopes,
  validateOwnedChannels,
} from '../../supabase/functions/_shared/youtube-oauth.mjs';

const OWNER = '11111111-1111-4111-8111-111111111111'; // synthetic test identity
const OTHER = '22222222-2222-4222-8222-222222222222';
const SESSION = '33333333-3333-4333-8333-333333333333';
const TX = '44444444-4444-4444-8444-444444444444';
const CHANNEL = 'UCabcdefghijklmnopqrstuvwxyz123456';
const STATE = 'A'.repeat(43); // synthetic 256-bit-state encoding
const CODE_CANARY = 'canary-authorization-code-never-log';
const JWT_CANARY = 'canary.jwt.must-never-log';
const ACCESS_CANARY = 'canary-access-token-never-log';
const REFRESH_CANARY = 'canary-refresh-token-never-log';
const PROVIDER_BODY_CANARY = 'canary-provider-body-never-log';
const claims = { role: 'authenticated', is_anonymous: false, aal: 'aal2', sub: OWNER, session_id: SESSION };

function request(url, { method = 'POST', headers = {}, body } = {}) {
  return new Request(url, { method, headers, ...(body === undefined ? {} : { body }) });
}

function makeStart(overrides = {}) {
  const calls = [];
  const events = [];
  const handler = createStartHandler({
    allowedUserId: OWNER,
    clientId: 'synthetic-client-id.apps.googleusercontent.com',
    verifyJwt: async (jwt) => {
      calls.push(['verifyJwt', jwt]);
      if (jwt !== 'valid-test-session') throw new Error(JWT_CANARY);
      return claims;
    },
    reserve: async (input) => { calls.push(['reserve', input]); return true; },
    log: { error: (...args) => events.push(args) },
    ...overrides,
  });
  return { handler, calls, events };
}

function startRequest({ authorization = 'Bearer valid-test-session', origin = ALLOWED_ORIGIN, body } = {}) {
  return request('https://supabase.example/functions/v1/youtube-oauth-start', {
    method: 'POST', headers: { origin, ...(authorization === null ? {} : { authorization }) }, body,
  });
}

function makeCallback(overrides = {}) {
  const calls = [];
  const events = [];
  let consumed = false;
  const transaction = {
    transaction_id: TX,
    user_id: OWNER,
    session_id: SESSION,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    consumed_at: null,
    finished_at: null,
  };
  const handler = createCallbackHandler({
    allowedChannelId: CHANNEL,
    requiredScopes: OAUTH_SCOPES,
    lookupState: async (hash) => { calls.push(['lookup', hash]); return transaction; },
    verifySession: async (userId, sessionId) => {
      calls.push(['verifySession', userId, sessionId]); return true;
    },
    consumeState: async (hash) => {
      calls.push(['consume', hash]);
      if (consumed) return null;
      consumed = true;
      return transaction;
    },
    exchangeAuthorizationCode: async (code) => {
      calls.push(['exchange', code]);
      return { access_token: ACCESS_CANARY, refresh_token: REFRESH_CANARY,
        scope: OAUTH_SCOPES.join(' ') };
    },
    getOwnedChannels: async (accessToken) => {
      calls.push(['channels', accessToken]);
      return { items: [{ id: CHANNEL }] };
    },
    cutoverToken: async (transactionId, token) => {
      calls.push(['cutover', transactionId, token]); return true;
    },
    finish: async (transactionId, code) => {
      calls.push(['finish', transactionId, code]); return true;
    },
    log: { error: (...args) => events.push(args), warn: (...args) => events.push(args) },
    ...overrides,
  });
  return { handler, calls, events, transaction };
}

function callbackRequest(query = `state=${STATE}&code=${CODE_CANARY}`) {
  return request(`https://supabase.example/functions/v1/youtube-oauth-callback?${query}`, { method: 'GET' });
}

test('OAuth Start rejects missing and invalid bearer tokens before reservation', async () => {
  for (const authorization of [null, 'Bearer invalid']) {
    const { handler, calls } = makeStart();
    const response = await handler(startRequest({ authorization }));
    assert.equal(response.status, 401);
    assert.equal(calls.some(([name]) => name === 'reserve'), false);
  }
});

test('OAuth Start rejects role, anonymous, AAL1, allowlist mismatch, and missing session binding', async () => {
  for (const invalidClaims of [
    { ...claims, role: 'anon' },
    { ...claims, is_anonymous: true },
    { ...claims, aal: 'aal1' },
    { ...claims, sub: OTHER },
    { ...claims, session_id: undefined },
  ]) {
    const { handler, calls } = makeStart({ verifyJwt: async () => invalidClaims });
    const response = await handler(startRequest());
    assert.equal(response.status, 403);
    assert.equal(calls.some(([name]) => name === 'reserve'), false);
  }
});

test('OAuth Start requires the exact allowed Origin and POST method', async () => {
  const { handler } = makeStart();
  assert.equal((await handler(startRequest({ origin: 'https://evil.example' }))).status, 403);
  assert.equal((await handler(request('https://supabase.example/functions/v1/youtube-oauth-start', {
    method: 'GET', headers: { origin: ALLOWED_ORIGIN },
  }))).status, 405);
  const preflight = await handler(request('https://supabase.example/functions/v1/youtube-oauth-start', {
    method: 'OPTIONS', headers: { origin: ALLOWED_ORIGIN },
  }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
});

test('OAuth Start returns an authorization URL and reserves only a SHA-256 state hash', async () => {
  const { handler, calls } = makeStart();
  const response = await handler(startRequest({ body: JSON.stringify({
    scope: 'attacker-scope', redirect_uri: 'https://evil.example', channel_id: OTHER,
    user_id: OTHER, session_id: OTHER,
  }) }));
  assert.equal(response.status, 200);
  const payload = await response.json();
  const authorizationUrl = new URL(payload.authorization_url);
  const state = authorizationUrl.searchParams.get('state');
  const reservation = calls.find(([name]) => name === 'reserve')[1];
  assert.equal(state.length, 43);
  assert.match(reservation.stateHash, /^[0-9a-f]{64}$/);
  assert.equal(reservation.stateHash, await hashState(state));
  assert.equal(JSON.stringify(reservation).includes(state), false);
  assert.equal(authorizationUrl.searchParams.get('redirect_uri'), OAUTH_REDIRECT_URI);
  assert.deepEqual(new Set(authorizationUrl.searchParams.get('scope').split(' ')), new Set(OAUTH_SCOPES));
  assert.equal(authorizationUrl.searchParams.get('client_id'), 'synthetic-client-id.apps.googleusercontent.com');
  assert.equal(authorizationUrl.searchParams.get('response_type'), 'code');
  assert.equal('user_id' in payload, false);
});

test('OAuth Start fails closed if state reservation fails and does not leak state', async () => {
  const { handler, events } = makeStart({ reserve: async () => false });
  const response = await handler(startRequest());
  const body = await response.text();
  assert.equal(response.status, 503);
  assert.doesNotMatch(body + JSON.stringify(events), /[A-Za-z0-9_-]{43}/);
});

test('transaction TTL uses a configurable server-side value capped at ten minutes', () => {
  assert.equal(transactionTtlSeconds(undefined), 600);
  assert.equal(transactionTtlSeconds('300'), 300);
  for (const invalid of ['0', '601', 'not-a-number']) assert.throws(() => transactionTtlSeconds(invalid));
});

test('callback rejects missing state, code, or malformed duplicate query before lookup', async () => {
  for (const query of ['', `state=${STATE}`, `state=${STATE}&state=${STATE}&code=x`, `state=${STATE}&code=x&code=y`]) {
    const { handler, calls } = makeCallback();
    const response = await handler(callbackRequest(query));
    assert.equal(response.status, 400);
    assert.equal(calls.some(([name]) => name === 'lookup'), false);
  }
});

test('callback rejects invalid, expired, consumed, or wrongly bound transactions before exchange', async () => {
  const cases = [
    { lookupState: async () => null },
    { lookupState: async (_hash) => ({ ...makeCallback().transaction, expires_at: new Date(0).toISOString() }) },
    { lookupState: async (_hash) => ({ ...makeCallback().transaction, consumed_at: new Date().toISOString() }) },
    { lookupState: async (_hash) => ({ ...makeCallback().transaction, user_id: OTHER }) },
  ];
  for (const override of cases) {
    const { handler, calls } = makeCallback(override);
    const response = await handler(callbackRequest());
    assert.notEqual(response.status, 200);
    assert.equal(calls.some(([name]) => name === 'exchange'), false);
  }
});

test('callback rejects revoked, missing, expired, or wrong-user sessions before atomic consume', async () => {
  const { handler, calls } = makeCallback({ verifySession: async () => false });
  assert.equal((await handler(callbackRequest())).status, 403);
  assert.equal(calls.some(([name]) => name === 'consume'), false);
  assert.equal(calls.some(([name]) => name === 'exchange'), false);
});

test('concurrent callback replay can consume once and perform only one code exchange', async () => {
  const { handler, calls } = makeCallback({
    consumeState: (() => {
      let consumed = false;
      return async () => {
        await Promise.resolve();
        if (consumed) return null;
        consumed = true;
        return { transaction_id: TX, user_id: OWNER, session_id: SESSION };
      };
    })(),
  });
  const [first, second] = await Promise.all([handler(callbackRequest()), handler(callbackRequest())]);
  assert.equal([first.status, second.status].filter((status) => status === 200).length, 1);
  assert.equal(calls.filter(([name]) => name === 'exchange').length, 1);
});

test('Google denial consumes a valid transaction and finishes without code exchange', async () => {
  const { handler, calls } = makeCallback();
  const response = await handler(callbackRequest(`state=${STATE}&error=access_denied`));
  assert.equal(response.status, 400);
  assert.equal(calls.some(([name]) => name === 'consume'), true);
  assert.equal(calls.some(([name]) => name === 'exchange'), false);
  assert.equal(calls.some(([name, _tx, code]) => name === 'finish' && code === 'provider_denied'), true);
});

test('scope validation fails closed for missing, malformed, or insufficient scope fields', () => {
  for (const scope of [undefined, '', '\n', 'youtube.upload, youtube.readonly', 'youtube.upload']) {
    assert.throws(() => validateGrantedScopes(scope, OAUTH_SCOPES));
  }
  assert.equal(validateGrantedScopes(OAUTH_SCOPES.slice().reverse().join(' '), OAUTH_SCOPES), true);
});

test('channel validation accepts exactly one server-allowed channel and rejects ambiguity', () => {
  assert.equal(validateOwnedChannels({ items: [{ id: CHANNEL }] }, CHANNEL), CHANNEL);
  for (const payload of [
    { items: [] },
    { items: [{ id: CHANNEL }, { id: 'UCother' }] },
    { items: [{}] },
    { items: [{ id: 'UCother' }] },
    null,
  ]) assert.throws(() => validateOwnedChannels(payload, CHANNEL));
});

test('callback provider, scope, channel, and token failures never cut over a token', async () => {
  const cases = [
    { exchangeAuthorizationCode: async () => { throw new Error(PROVIDER_BODY_CANARY); } },
    { exchangeAuthorizationCode: async () => ({ access_token: ACCESS_CANARY, scope: OAUTH_SCOPES.join(' ') }) },
    { exchangeAuthorizationCode: async () => ({ access_token: ACCESS_CANARY, refresh_token: REFRESH_CANARY, scope: 'youtube.upload' }) },
    { getOwnedChannels: async () => ({ items: [] }) },
    { getOwnedChannels: async () => ({ items: [{ id: 'UCwrong' }] }) },
    { exchangeAuthorizationCode: async () => ({ access_token: ACCESS_CANARY, refresh_token: ' ', scope: OAUTH_SCOPES.join(' ') }) },
  ];
  for (const overrides of cases) {
    const { handler, calls } = makeCallback({
      ...overrides,
    });
    assert.notEqual((await handler(callbackRequest())).status, 200);
    assert.equal(calls.some(([name]) => name === 'cutover'), false);
  }
});

test('failed atomic cutover reports failure and does not attempt a second write', async () => {
  const { handler, calls } = makeCallback({
    cutoverToken: async (transactionId, token) => {
      calls.push(['cutover', transactionId, token]);
      return false;
    },
  });
  const response = await handler(callbackRequest());
  assert.equal(response.status, 503);
  assert.equal(calls.filter(([name]) => name === 'cutover').length, 1);
});

test('successful callback validates then atomically cuts over token and emits no credentials', async () => {
  const { handler, calls } = makeCallback();
  const response = await handler(callbackRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(calls.filter(([name]) => ['lookup', 'verifySession', 'consume', 'exchange', 'channels', 'cutover'].includes(name))
    .map(([name]) => name), ['lookup', 'verifySession', 'consume', 'exchange', 'channels', 'cutover']);
  assert.equal(calls.some(([name, _id, token]) => name === 'cutover' && token === REFRESH_CANARY), true);
  const body = await response.text();
  assert.doesNotMatch(body, /token|UUID|videoId/i);
  for (const canary of [CODE_CANARY, ACCESS_CANARY, REFRESH_CANARY, CHANNEL, OWNER, SESSION]) {
    assert.equal(body.includes(canary), false);
  }
});

test('JWT, state, code, tokens, provider body, identity and exceptions never reach logs or responses', async () => {
  const { handler, events } = makeCallback({
    exchangeAuthorizationCode: async () => { throw new Error(`${JWT_CANARY} ${CODE_CANARY} ${ACCESS_CANARY} ${REFRESH_CANARY} ${PROVIDER_BODY_CANARY} ${OTHER}`); },
  });
  const response = await handler(callbackRequest());
  const output = (await response.text()) + JSON.stringify(events);
  for (const canary of [JWT_CANARY, STATE, CODE_CANARY, ACCESS_CANARY, REFRESH_CANARY, PROVIDER_BODY_CANARY, OTHER]) {
    assert.equal(output.includes(canary), false, `leaked canary ${canary}`);
  }
});

test('Google provider can be exercised only through injected fetch and returns no raw error body', async () => {
  const requests = [];
  const provider = createGoogleProvider({
    clientId: 'synthetic-client-id', clientSecret: 'synthetic-client-secret',
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), init });
      if (String(url).includes('/token')) return Response.json({
        access_token: ACCESS_CANARY, refresh_token: REFRESH_CANARY, scope: OAUTH_SCOPES.join(' '),
      });
      return Response.json({ items: [{ id: CHANNEL }] });
    },
  });
  const tokenResponse = await provider.exchangeAuthorizationCode(CODE_CANARY);
  const channelResponse = await provider.getOwnedChannels(tokenResponse.access_token);
  assert.equal(requests.length, 2);
  assert.equal(new URL(requests[0].url).origin, 'https://oauth2.googleapis.com');
  assert.equal(new URLSearchParams(requests[0].init.body).get('code'), CODE_CANARY);
  assert.equal(new URL(requests[1].url).origin, 'https://www.googleapis.com');
  assert.equal(new URL(requests[1].url).searchParams.get('mine'), 'true');
  assert.equal(requests[1].init.headers.authorization, `Bearer ${ACCESS_CANARY}`);
  assert.deepEqual(channelResponse.items, [{ id: CHANNEL }]);

  const badProvider = createGoogleProvider({
    clientId: 'synthetic-client-id', clientSecret: 'synthetic-client-secret',
    fetchImpl: async () => new Response(PROVIDER_BODY_CANARY, { status: 500 }),
  });
  await assert.rejects(() => badProvider.exchangeAuthorizationCode(CODE_CANARY), (error) => {
    assert.equal(error.code, 'exchange_failed');
    assert.doesNotMatch(error.message, new RegExp(PROVIDER_BODY_CANARY));
    return true;
  });
});
