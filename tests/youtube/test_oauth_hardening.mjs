import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_ORIGIN,
  OAUTH_REDIRECT_URI,
  OAUTH_SCOPES,
  createCallbackHandler,
  createGoogleProvider,
  createStartHandler,
  generateState,
  hashState,
  transactionTtlBoundedByJwtExpiry,
  validateGrantedScopes,
  validateOwnedChannels,
  verifyCurrentStartUser,
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
const claims = { role: 'authenticated', is_anonymous: false, aal: 'aal2', sub: OWNER, session_id: SESSION,
  exp: Math.floor(Date.now() / 1000) + 3600 };

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
    consumeState: async (hash) => {
      calls.push(['atomicConsume', hash]);
      if (consumed) return { status: 'rejected' };
      consumed = true;
      return { status: 'consumed', transactionId: transaction.transaction_id };
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

test('Start verification requires a live Auth user matching verified JWT claims', async () => {
  const calls = [];
  const authClient = { auth: {
    getClaims: async (jwt) => { calls.push(['claims', jwt]); return { data: { claims }, error: null }; },
    getUser: async (jwt) => { calls.push(['user', jwt]); return { data: { user: { id: OWNER } }, error: null }; },
  } };
  assert.deepEqual(await verifyCurrentStartUser(authClient, 'valid-test-session'), claims);
  assert.deepEqual(calls, [['claims', 'valid-test-session'], ['user', 'valid-test-session']]);

  authClient.auth.getUser = async () => ({ data: { user: null }, error: { code: 'session_revoked' } });
  assert.equal(await verifyCurrentStartUser(authClient, 'revoked-test-session'), null);
  authClient.auth.getUser = async () => ({ data: { user: { id: OTHER } }, error: null });
  assert.equal(await verifyCurrentStartUser(authClient, 'mismatched-test-session'), null);
});

test('OAuth state is a 43-character base64url string with 256-bit source length', () => {
  const first = generateState();
  const second = generateState();
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
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

test('OAuth Start rejects missing or already expiring verified JWT claims before reservation', async () => {
  for (const invalidClaims of [
    { ...claims, exp: undefined },
    { ...claims, exp: Math.floor(Date.now() / 1000) + 20 },
  ]) {
    const { handler, calls } = makeStart({ verifyJwt: async () => invalidClaims });
    const response = await handler(startRequest());
    assert.equal(response.status, 401);
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

test('OAuth transaction TTL is fixed to five minutes and bounded by verified JWT expiry', () => {
  const nowMs = 1_800_000_000_000;
  assert.equal(transactionTtlBoundedByJwtExpiry(nowMs / 1000 + 600, nowMs), 300);
  assert.equal(transactionTtlBoundedByJwtExpiry(nowMs / 1000 + 100, nowMs), 70);
  assert.throws(() => transactionTtlBoundedByJwtExpiry(nowMs / 1000 + 50, nowMs));
  assert.throws(() => transactionTtlBoundedByJwtExpiry(undefined, nowMs));
});

test('OAuth callback can finish an issued capability after logout without rechecking Supabase session', async () => {
  let sessionActive = true;
  const start = makeStart({ verifyJwt: async () => sessionActive ? claims : null });
  const startResponse = await start.handler(startRequest());
  assert.equal(startResponse.status, 200);

  sessionActive = false;
  const callback = makeCallback();
  const callbackResponse = await callback.handler(callbackRequest());

  assert.equal(callbackResponse.status, 200);
  assert.deepEqual(callback.calls.filter(([name]) => ['atomicConsume', 'exchange', 'channels', 'cutover'].includes(name))
    .map(([name]) => name), ['atomicConsume', 'exchange', 'channels', 'cutover']);
});

test('callback rejects missing state, code, or malformed duplicate query before lookup', async () => {
  for (const query of ['', `state=${STATE}`, `state=${STATE}&state=${STATE}&code=x`, `state=${STATE}&code=x&code=y`]) {
    const { handler, calls } = makeCallback();
    const response = await handler(callbackRequest(query));
    assert.equal(response.status, 400);
    assert.equal(calls.some(([name]) => name === 'lookup'), false);
  }
});

test('callback rejects invalid, expired, consumed, finished, or wrongly bound state at the atomic boundary', async () => {
  const { handler, calls } = makeCallback({ consumeState: async (hash) => {
    calls.push(['atomicConsume', hash]);
    return { status: 'rejected' };
  } });
  assert.equal((await handler(callbackRequest())).status, 400);
  assert.equal(calls.filter(([name]) => name === 'atomicConsume').length, 1);
  assert.equal(calls.some(([name]) => name === 'exchange'), false);
  assert.equal(calls.some(([name]) => name === 'lookup' || name === 'verifySession'), false);
});

test('concurrent callback replay can consume once and perform only one code exchange', async () => {
  const { handler, calls } = makeCallback({
    consumeState: (() => {
      let consumed = false;
      return async () => {
        await Promise.resolve();
        if (consumed) return { status: 'rejected' };
        consumed = true;
        return { status: 'consumed', transactionId: TX };
      };
    })(),
  });
  const [first, second] = await Promise.all([handler(callbackRequest()), handler(callbackRequest())]);
  assert.equal([first.status, second.status].filter((status) => status === 200).length, 1);
  assert.equal(calls.filter(([name]) => name === 'exchange').length, 1);
});

test('atomic consume RPC failure or ambiguous timeout blocks code exchange and is never retried', async () => {
  for (const status of ['unavailable', 'rejected']) {
    let rpcCalls = 0;
    const { handler, calls } = makeCallback({ consumeState: async () => {
      rpcCalls += 1;
      return { status };
    } });
    const response = await handler(callbackRequest());
    assert.equal(response.status, status === 'unavailable' ? 503 : 400);
    assert.equal(rpcCalls, 1);
    assert.equal(calls.some(([name]) => name === 'exchange'), false);
    assert.equal(calls.some(([name]) => name === 'finish'), false);
  }
});

test('Google denial consumes a valid transaction and finishes without code exchange', async () => {
  const { handler, calls } = makeCallback();
  const response = await handler(callbackRequest(`state=${STATE}&error=access_denied`));
  assert.equal(response.status, 400);
  assert.equal(calls.some(([name]) => name === 'atomicConsume'), true);
  assert.equal(calls.some(([name]) => name === 'exchange'), false);
  assert.equal(calls.some(([name, _tx, code]) => name === 'finish' && code === 'provider_denied'), true);
  const replay = await handler(callbackRequest(`state=${STATE}&error=access_denied`));
  assert.equal(replay.status, 400);
  assert.equal(calls.filter(([name]) => name === 'atomicConsume').length, 2);
  assert.equal(calls.some(([name]) => name === 'exchange'), false);
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
  assert.deepEqual(calls.filter(([name]) => ['lookup', 'verifySession', 'consume', 'atomicConsume', 'exchange', 'channels', 'cutover'].includes(name))
    .map(([name]) => name), ['atomicConsume', 'exchange', 'channels', 'cutover']);
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
