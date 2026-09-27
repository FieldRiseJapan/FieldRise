export const ALLOWED_ORIGIN = 'https://fieldrisejapan.github.io';
export const OAUTH_REDIRECT_URI = 'https://nmkcjtrllzkwjxmjromw.supabase.co/functions/v1/youtube-oauth-callback';
export const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_CHANNELS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/channels';
export const OAUTH_SCOPES = Object.freeze([
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]);
export const DEFAULT_TRANSACTION_TTL_SECONDS = 600;
export const MAX_TRANSACTION_TTL_SECONDS = 600;
export const MIN_TRANSACTION_TTL_SECONDS = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATE = /^[A-Za-z0-9_-]{43}$/;
const SAFE_RESULT_CODES = new Set([
  'provider_denied', 'exchange_failed', 'scope_rejected', 'channel_rejected',
  'refresh_missing', 'storage_failed', 'token_stored',
]);

export class OAuthFlowError extends Error {
  constructor(code, status = 400, stage = 'request') {
    super(code);
    this.name = 'OAuthFlowError';
    this.code = code;
    this.status = status;
    this.stage = stage;
  }
}

export function isUuid(value) {
  return typeof value === 'string' && UUID.test(value);
}

export function transactionTtlSeconds(value) {
  if (value === undefined || value === null || value === '') return DEFAULT_TRANSACTION_TTL_SECONDS;
  if (!/^\d+$/.test(String(value))) throw new TypeError('invalid_ttl_configuration');
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds < MIN_TRANSACTION_TTL_SECONDS ||
      seconds > MAX_TRANSACTION_TTL_SECONDS) throw new TypeError('invalid_ttl_configuration');
  return seconds;
}

export function transactionTtlBoundedByJwtExpiry(configuredValue, jwtExpiresAt, nowMs = Date.now(), skewSeconds = 30) {
  const configured = transactionTtlSeconds(configuredValue);
  if (!Number.isSafeInteger(jwtExpiresAt) || !Number.isFinite(nowMs) ||
      !Number.isSafeInteger(skewSeconds) || skewSeconds < 0) {
    throw new OAuthFlowError('invalid_session_expiry', 401, 'authorize');
  }
  const remaining = Math.floor((jwtExpiresAt * 1000 - nowMs) / 1000) - skewSeconds;
  const bounded = Math.min(configured, remaining);
  if (!Number.isSafeInteger(bounded) || bounded < MIN_TRANSACTION_TTL_SECONDS) {
    throw new OAuthFlowError('session_expiring', 401, 'authorize');
  }
  return bounded;
}

function firstRpcRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data && typeof data === 'object' ? data : null;
}

export function createOAuthRepository(client) {
  async function call(name, args) {
    try {
      const result = await client.rpc(name, args);
      if (result?.error) return null;
      return result?.data ?? null;
    } catch {
      return null;
    }
  }

  return {
    async reserve({ transactionId, stateHash, userId, sessionId, ttlSeconds }) {
      const data = await call('youtube_oauth_reserve', {
        p_transaction_id: transactionId,
        p_state_hash: toPostgresBytea(stateHash),
        p_user_id: userId,
        p_session_id: sessionId,
        p_ttl_seconds: ttlSeconds,
      });
      return data === true;
    },
    async consumeState(stateHash) {
      try {
        const { data, error } = await client.rpc('youtube_oauth_consume_state', {
          p_state_hash: toPostgresBytea(stateHash),
        });
        if (error) return { status: 'unavailable' };
        const row = firstRpcRow(data);
        if (!row) return { status: 'rejected' };
        if (!isUuid(row.transaction_id)) return { status: 'unavailable' };
        return { status: 'consumed', transactionId: row.transaction_id };
      } catch {
        // A timeout may follow a committed consume. Never retry this call.
        return { status: 'unavailable' };
      }
    },
    async finish(transactionId, resultCode) {
      if (!SAFE_RESULT_CODES.has(resultCode) || resultCode === 'token_stored') return false;
      return await call('youtube_oauth_finish', {
        p_transaction_id: transactionId,
        p_result_code: resultCode,
      }) === true;
    },
    async cutoverToken(transactionId, refreshToken) {
      if (typeof refreshToken !== 'string' || !refreshToken.trim()) return false;
      return await call('youtube_oauth_cutover_token', {
        p_transaction_id: transactionId,
        p_refresh_token: refreshToken,
      }) === true;
    },
  };
}

export function generateState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export async function hashState(state) {
  if (typeof state !== 'string' || !STATE.test(state)) throw new OAuthFlowError('invalid_state');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(state));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function toPostgresBytea(hexHash) {
  if (typeof hexHash !== 'string' || !/^[0-9a-f]{64}$/.test(hexHash)) {
    throw new OAuthFlowError('invalid_state_hash');
  }
  return `\\x${hexHash}`;
}

export function validateGrantedScopes(scopeText, requiredScopes = OAUTH_SCOPES) {
  if (typeof scopeText !== 'string' || !scopeText.trim()) throw new OAuthFlowError('scope_rejected', 403, 'scope');
  const values = scopeText.trim().split(/\s+/);
  if (values.some((value) => !/^https:\/\/www\.googleapis\.com\/auth\/[A-Za-z0-9._-]+$/.test(value))) {
    throw new OAuthFlowError('scope_rejected', 403, 'scope');
  }
  const granted = new Set(values);
  if (!Array.isArray(requiredScopes) || requiredScopes.length === 0 ||
      requiredScopes.some((scope) => !granted.has(scope))) {
    throw new OAuthFlowError('scope_rejected', 403, 'scope');
  }
  return true;
}

export function validateOwnedChannels(payload, allowedChannelId) {
  if (typeof allowedChannelId !== 'string' || !allowedChannelId.trim() ||
      !payload || !Array.isArray(payload.items) || payload.items.length !== 1) {
    throw new OAuthFlowError('channel_rejected', 403, 'channel');
  }
  const channelId = payload.items[0]?.id;
  if (typeof channelId !== 'string' || !channelId || channelId !== allowedChannelId) {
    throw new OAuthFlowError('channel_rejected', 403, 'channel');
  }
  return channelId;
}

function corsHeaders(origin) {
  if (origin !== ALLOWED_ORIGIN) return { vary: 'Origin' };
  return {
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, content-type',
    'access-control-max-age': '300',
    vary: 'Origin',
  };
}

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
      'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', ...headers },
  });
}

function safeLog(log, level, requestId, stage, code) {
  const method = typeof log?.[level] === 'function' ? log[level].bind(log) : () => {};
  method('youtube oauth request failed', { request_id: requestId, stage, error_code: code });
}

function bearerToken(request) {
  const value = request.headers.get('authorization');
  const match = value?.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] ?? null;
}

function authorizeStartClaims(claims, allowedUserId) {
  if (!isUuid(allowedUserId)) throw new OAuthFlowError('server_configuration_unavailable', 503, 'authorize');
  if (!claims || claims.role !== 'authenticated' || claims.is_anonymous === true ||
      claims.aal !== 'aal2' || claims.sub !== allowedUserId || !isUuid(claims.sub) ||
      !isUuid(claims.session_id)) {
    throw new OAuthFlowError('forbidden', 403, 'authorize');
  }
}

export function createStartHandler({
  verifyJwt,
  reserve,
  allowedUserId,
  clientId,
  redirectUri = OAUTH_REDIRECT_URI,
  authorizationEndpoint = GOOGLE_AUTHORIZATION_ENDPOINT,
  ttlSeconds = DEFAULT_TRANSACTION_TTL_SECONDS,
  log = console,
}) {
  return async (request) => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('origin');
    const cors = corsHeaders(origin);
    if (origin !== ALLOWED_ORIGIN) return jsonResponse(403, { success: false, code: 'origin_denied', request_id: requestId }, cors);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return jsonResponse(405, { success: false, code: 'method_not_allowed', request_id: requestId }, cors);

    let stage = 'authorize';
    try {
      const jwt = bearerToken(request);
      if (!jwt) throw new OAuthFlowError('unauthorized', 401, stage);
      if (typeof verifyJwt !== 'function') throw new OAuthFlowError('server_configuration_unavailable', 503, stage);
      let claims;
      try { claims = await verifyJwt(jwt); } catch { throw new OAuthFlowError('unauthorized', 401, stage); }
      if (!claims) throw new OAuthFlowError('unauthorized', 401, stage);
      authorizeStartClaims(claims, allowedUserId);

      if (!clientId || !redirectUri || typeof reserve !== 'function') {
        throw new OAuthFlowError('server_configuration_unavailable', 503, 'configuration');
      }
      // Keep stored transaction expiry within the verified JWT validity window.
      const ttl = transactionTtlBoundedByJwtExpiry(ttlSeconds, claims.exp);
      const state = generateState();
      const stateHash = await hashState(state);
      const transactionId = crypto.randomUUID();
      stage = 'reserve';
      const reserved = await reserve({
        transactionId,
        stateHash,
        userId: claims.sub,
        sessionId: claims.session_id,
        ttlSeconds: ttl,
      });
      if (reserved !== true) throw new OAuthFlowError('state_unavailable', 503, stage);

      const authorizationUrl = new URL(authorizationEndpoint);
      authorizationUrl.searchParams.set('client_id', clientId);
      authorizationUrl.searchParams.set('redirect_uri', redirectUri);
      authorizationUrl.searchParams.set('response_type', 'code');
      authorizationUrl.searchParams.set('scope', OAUTH_SCOPES.join(' '));
      authorizationUrl.searchParams.set('state', state);
      authorizationUrl.searchParams.set('access_type', 'offline');
      authorizationUrl.searchParams.set('include_granted_scopes', 'true');
      authorizationUrl.searchParams.set('prompt', 'consent');
      return jsonResponse(200, { success: true, authorization_url: authorizationUrl.toString(), request_id: requestId }, cors);
    } catch (error) {
      const safe = error instanceof OAuthFlowError ? error : new OAuthFlowError('start_failed', 503, stage);
      safeLog(log, 'error', requestId, safe.stage, safe.code);
      return jsonResponse(safe.status, { success: false, code: safe.code, request_id: requestId }, cors);
    }
  };
}

function oneQueryValue(url, key, { required = false, maxLength = 4096 } = {}) {
  const values = url.searchParams.getAll(key);
  if (values.length > 1) throw new OAuthFlowError('invalid_callback', 400, 'query');
  const value = values[0] ?? null;
  if ((required && !value) || (value !== null && (!value.length || value.length > maxLength || /[\u0000-\u001f\u007f]/.test(value)))) {
    throw new OAuthFlowError('invalid_callback', 400, 'query');
  }
  return value;
}

async function finalizeFailure(finish, transactionId, resultCode) {
  if (!SAFE_RESULT_CODES.has(resultCode) || typeof finish !== 'function') return;
  try { await finish(transactionId, resultCode); } catch { /* Do not expose or log database errors. */ }
}

export function createCallbackHandler({
  consumeState,
  exchangeAuthorizationCode,
  getOwnedChannels,
  cutoverToken,
  finish,
  allowedChannelId,
  requiredScopes = OAUTH_SCOPES,
  log = console,
}) {
  return async (request) => {
    const requestId = crypto.randomUUID();
    if (request.method !== 'GET') return jsonResponse(405, { success: false, code: 'method_not_allowed', request_id: requestId });
    let stage = 'query';
    let consumedTransactionId = null;
    try {
      const url = new URL(request.url);
      const state = oneQueryValue(url, 'state', { required: true, maxLength: 128 });
      const providerError = oneQueryValue(url, 'error', { maxLength: 128 });
      const code = oneQueryValue(url, 'code', { maxLength: 4096 });
      if (!providerError && !code) throw new OAuthFlowError('invalid_callback', 400, 'query');
      const stateHash = await hashState(state);
      if (typeof consumeState !== 'function') throw new OAuthFlowError('callback_unavailable', 503, 'configuration');

      stage = 'consume';
      const consumeResult = await consumeState(stateHash);
      if (consumeResult?.status === 'unavailable') {
        // A timeout may follow a committed consume. Do not exchange the code or
        // retry; the caller must start a fresh OAuth flow.
        throw new OAuthFlowError('callback_unavailable', 503, stage);
      }
      if (consumeResult?.status !== 'consumed' || !isUuid(consumeResult.transactionId)) {
        throw new OAuthFlowError('invalid_transaction', 400, stage);
      }
      const transactionId = consumeResult.transactionId;
      consumedTransactionId = transactionId;

      if (providerError) {
        await finalizeFailure(finish, transactionId, 'provider_denied');
        return jsonResponse(400, { success: false, code: 'authorization_denied', request_id: requestId });
      }

      stage = 'exchange';
      if (typeof exchangeAuthorizationCode !== 'function') throw new OAuthFlowError('callback_unavailable', 503, stage);
      const tokenResponse = await exchangeAuthorizationCode(code);
      if (!tokenResponse || typeof tokenResponse.access_token !== 'string' || !tokenResponse.access_token ||
          typeof tokenResponse.refresh_token !== 'string' || !tokenResponse.refresh_token.trim()) {
        throw new OAuthFlowError('refresh_missing', 502, 'token');
      }

      stage = 'scope';
      validateGrantedScopes(tokenResponse.scope, requiredScopes);

      stage = 'channel';
      if (typeof getOwnedChannels !== 'function') throw new OAuthFlowError('callback_unavailable', 503, stage);
      const channelResponse = await getOwnedChannels(tokenResponse.access_token);
      validateOwnedChannels(channelResponse, allowedChannelId);

      stage = 'cutover';
      if (typeof cutoverToken !== 'function' ||
          await cutoverToken(transactionId, tokenResponse.refresh_token) !== true) {
        throw new OAuthFlowError('token_storage_unavailable', 503, stage);
      }
      consumedTransactionId = null;
      return jsonResponse(200, { success: true, status: 'authorized', request_id: requestId });
    } catch (error) {
      const safe = error instanceof OAuthFlowError ? error : new OAuthFlowError('callback_failed', 503, stage);
      if (consumedTransactionId) {
        const resultCode = safe.code === 'scope_rejected' ? 'scope_rejected'
          : safe.code === 'channel_rejected' ? 'channel_rejected'
            : safe.code === 'refresh_missing' ? 'refresh_missing'
              : safe.stage === 'exchange' ? 'exchange_failed' : 'storage_failed';
        await finalizeFailure(finish, consumedTransactionId, resultCode);
      }
      safeLog(log, 'error', requestId, safe.stage, safe.code);
      return jsonResponse(safe.status, { success: false, code: safe.code, request_id: requestId });
    }
  };
}

async function providerJson(response, safeCode, stage) {
  if (!response.ok) throw new OAuthFlowError(safeCode, 502, stage);
  try { return await response.json(); } catch { throw new OAuthFlowError(safeCode, 502, stage); }
}

export function createGoogleProvider({ clientId, clientSecret, redirectUri = OAUTH_REDIRECT_URI,
  fetchImpl = fetch, timeoutMs = 10_000 }) {
  return {
    async exchangeAuthorizationCode(code) {
      if (!clientId || !clientSecret || !code) throw new OAuthFlowError('callback_unavailable', 503, 'configuration');
      let response;
      try {
        response = await fetchImpl(GOOGLE_TOKEN_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret,
            redirect_uri: redirectUri, grant_type: 'authorization_code' }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch { throw new OAuthFlowError('exchange_failed', 502, 'exchange'); }
      const result = await providerJson(response, 'exchange_failed', 'exchange');
      return { access_token: result.access_token, refresh_token: result.refresh_token, scope: result.scope };
    },
    async getOwnedChannels(accessToken) {
      if (!accessToken) throw new OAuthFlowError('channel_rejected', 502, 'channel');
      const url = new URL(GOOGLE_CHANNELS_ENDPOINT);
      url.searchParams.set('part', 'id');
      url.searchParams.set('mine', 'true');
      let response;
      try {
        response = await fetchImpl(url, {
          method: 'GET', headers: { authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch { throw new OAuthFlowError('channel_rejected', 502, 'channel'); }
      return await providerJson(response, 'channel_rejected', 'channel');
    },
  };
}
