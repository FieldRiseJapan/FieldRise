import test from 'node:test';
import assert from 'node:assert/strict';
import { createOAuthRepository } from '../../supabase/functions/_shared/youtube-oauth.mjs';

const HASH = 'ab'.repeat(32);
const TX = '44444444-4444-4444-8444-444444444444';
const USER = '11111111-1111-4111-8111-111111111111';
const SESSION = '33333333-3333-4333-8333-333333333333';

function fakeDb(responses = {}) {
  const calls = [];
  return { calls, rpc: async (name, args) => {
    calls.push([name, args]);
    return responses[name] ?? { data: true, error: null };
  } };
}

test('reserve stores state hash as bytea and only server-derived transaction binding', async () => {
  const db = fakeDb();
  const repo = createOAuthRepository(db);
  assert.equal(await repo.reserve({ transactionId: TX, stateHash: HASH, userId: USER, sessionId: SESSION, ttlSeconds: 600 }), true);
  assert.deepEqual(db.calls[0], ['youtube_oauth_reserve', {
    p_transaction_id: TX, p_state_hash: `\\x${HASH}`, p_user_id: USER, p_session_id: SESSION, p_ttl_seconds: 600,
  }]);
  assert.equal(JSON.stringify(db.calls).includes('raw-state'), false);
});

test('lookup and consume normalize one RPC row and never retry implicitly', async () => {
  const pending = { transaction_id: TX, user_id: USER, session_id: SESSION, expires_at: new Date(Date.now() + 60_000).toISOString() };
  const db = fakeDb({
    youtube_oauth_get_pending_state: { data: [pending], error: null },
    youtube_oauth_consume_state: { data: [pending], error: null },
  });
  const repo = createOAuthRepository(db);
  assert.deepEqual(await repo.lookupState(HASH), pending);
  assert.deepEqual(await repo.consumeState(HASH), pending);
  assert.deepEqual(db.calls.map(([name]) => name), ['youtube_oauth_get_pending_state', 'youtube_oauth_consume_state']);
});

test('session verifier is an injected fail-closed boundary until staging validates its implementation', async () => {
  const db = fakeDb();
  const absent = createOAuthRepository(db);
  assert.equal(await absent.verifySession(USER, SESSION, new Date().toISOString()), false);
  assert.equal(db.calls.length, 0);
  const injected = createOAuthRepository(db, { sessionVerifier: async (user, session, expiry) =>
    user === USER && session === SESSION && typeof expiry === 'string' });
  assert.equal(await injected.verifySession(USER, SESSION, new Date().toISOString()), true);
});

test('database errors become safe failure values and cutover/finish use explicit RPCs', async () => {
  const db = fakeDb({
    youtube_oauth_reserve: { data: null, error: { message: 'do not expose' } },
    youtube_oauth_finish: { data: true, error: null },
    youtube_oauth_cutover_token: { data: true, error: null },
  });
  const repo = createOAuthRepository(db);
  assert.equal(await repo.reserve({ transactionId: TX, stateHash: HASH, userId: USER, sessionId: SESSION, ttlSeconds: 600 }), false);
  assert.equal(await repo.finish(TX, 'exchange_failed'), true);
  assert.equal(await repo.cutoverToken(TX, 'test-token-value'), true);
  assert.deepEqual(db.calls.map(([name]) => name), [
    'youtube_oauth_reserve', 'youtube_oauth_finish', 'youtube_oauth_cutover_token',
  ]);
});

test('null or empty refresh token cannot invoke the cutover RPC', async () => {
  const db = fakeDb();
  const repo = createOAuthRepository(db);
  assert.equal(await repo.cutoverToken(TX, null), false);
  assert.equal(await repo.cutoverToken(TX, ''), false);
  assert.equal(await repo.cutoverToken(TX, '   '), false);
  assert.equal(db.calls.length, 0);
});
