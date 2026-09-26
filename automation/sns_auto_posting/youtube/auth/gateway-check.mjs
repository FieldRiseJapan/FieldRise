import { currentAuth } from './auth-flow.mjs';
import { SUPABASE_URL } from './public-config.mjs';

export const GATEWAY_URL = new URL('/functions/v1/youtube-upload-gateway', SUPABASE_URL).href;
export const AUTH_UI_ORIGIN = 'https://fieldrisejapan.github.io';
export const MAX_GATEWAY_TEST_VIDEO_BYTES = 2 * 1024 * 1024;

export async function runGatewaySafetyCheck({ auth, video, endpoint = GATEWAY_URL, origin,
  publishableKey, fetchImpl = fetch, makeIdempotencyKey = () => crypto.randomUUID() }) {
  const authState = await currentAuth(auth);
  if (!authState.signedIn || authState.aal !== 'aal2') {
    return { sent: false, success: false, reason: 'aal2_required' };
  }
  if (origin !== AUTH_UI_ORIGIN || endpoint !== GATEWAY_URL) {
    return { sent: false, success: false, reason: 'origin_or_endpoint_denied' };
  }
  if (!(video instanceof File) || !video.size || video.size > MAX_GATEWAY_TEST_VIDEO_BYTES ||
      video.type !== 'video/mp4' || !/\.mp4$/i.test(video.name)) {
    return { sent: false, success: false, reason: 'invalid_test_video' };
  }
  if (typeof publishableKey !== 'string' || !publishableKey) {
    return { sent: false, success: false, reason: 'configuration_unavailable' };
  }

  const { data, error } = await auth.getSession();
  const accessToken = data?.session?.access_token;
  if (error || !accessToken) return { sent: false, success: false, reason: 'session_unavailable' };

  const form = new FormData();
  form.append('title', 'Phase 2-B3 validation-only check');
  form.append('video', video, video.name);
  const idempotencyKey = makeIdempotencyKey();
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return { sent: false, success: false, reason: 'request_unavailable' };
  }

  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: form,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    return { sent: true, success: false, httpStatus: null, code: 'network_error' };
  }

  let body = null;
  try { body = await response.json(); } catch { /* show only a generic response state */ }
  const requestId = typeof body?.request_id === 'string' &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.request_id) ? body.request_id : undefined;
  const hasVideoId = !!body && Object.hasOwn(body, 'videoId');
  const success = response.status === 200 && body?.success === true && body?.status === 'validation_only' &&
    body?.authorized === true && body?.validated === true && body?.privacyStatus === 'private' && !hasVideoId;
  const safeCodes = new Set(['unauthorized', 'origin_denied', 'forbidden', 'unconfigured', 'idempotency_key_required',
    'request_too_large', 'multipart_required', 'invalid_body', 'unknown_part', 'duplicate_part', 'video_required',
    'video_size', 'video_type', 'title_required', 'title_invalid', 'description_invalid', 'duplicate_request',
    'upload_busy', 'rate_limited', 'state_unavailable', 'method_not_allowed']);
  return {
    sent: true,
    success,
    httpStatus: response.status,
    status: typeof body?.status === 'string' && body.status === 'validation_only' ? body.status : undefined,
    authorized: typeof body?.authorized === 'boolean' ? body.authorized : undefined,
    validated: typeof body?.validated === 'boolean' ? body.validated : undefined,
    privacyStatus: body?.privacyStatus === 'private' ? 'private' : undefined,
    requestId,
    code: safeCodes.has(body?.code) ? body.code : hasVideoId ? 'unexpected_response_shape' : undefined,
    hasVideoId,
  };
}
