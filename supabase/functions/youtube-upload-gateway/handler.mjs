import { authorize, corsHeaders, isUuid, validateParts, ALLOWED_ORIGIN,
  MAX_REQUEST_BYTES_PHASE1 } from './policy.mjs';

export function createHandler({ verifyJwt, reserve, finish, allowedUserId, log = console }) {
  return async (req) => {
    const requestId = crypto.randomUUID();
    const origin = req.headers.get('origin');
    const headers = { ...corsHeaders(origin), 'Cache-Control': 'no-store', 'X-Request-Id': requestId };
    const response = (status, code) => new Response(JSON.stringify({ success: false, code, request_id: requestId }),
      { status, headers: { ...headers, 'Content-Type': 'application/json' } });
    if (origin !== null && origin !== ALLOWED_ORIGIN) return response(403, 'origin_denied');
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return response(405, 'method_not_allowed');
    const bearer = req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/);
    if (!bearer) return response(401, 'unauthorized');
    let claims;
    try { claims = await verifyJwt(bearer[1]); } catch { return response(401, 'unauthorized'); }
    if (!claims) return response(401, 'unauthorized');
    const decision = authorize(claims, allowedUserId);
    if (decision) return response(decision === 'unconfigured' ? 503 : 403, decision);
    const key = req.headers.get('idempotency-key');
    if (!isUuid(key)) return response(400, 'idempotency_key_required');
    const length = req.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES_PHASE1))
      return response(413, 'request_too_large');
    if (!/^multipart\/form-data;\s*boundary=/i.test(req.headers.get('content-type') || ''))
      return response(415, 'multipart_required');
    // Bound the stream before formData() so a missing/false Content-Length cannot exhaust memory.
    let form;
    try {
      const reader = req.body?.getReader();
      if (!reader) return response(400, 'invalid_body');
      const chunks = []; let bytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_REQUEST_BYTES_PHASE1) { await reader.cancel(); return response(413, 'request_too_large'); }
        chunks.push(value);
      }
      form = await new Request(req.url, { method: 'POST', headers: { 'Content-Type': req.headers.get('content-type') },
        body: new Blob(chunks) }).formData();
    } catch { return response(400, 'invalid_body'); }
    const data = validateParts(form);
    if (typeof data === 'string') return response(data === 'video_size' ? 413 : 422, data);
    // No video bytes or credentials are saved. Reserve uses a DB transaction/lock shared by all instances.
    try {
      const outcome = await reserve(claims.sub, key);
      if (outcome === 'duplicate') return response(409, 'duplicate_request');
      if (outcome === 'busy') return response(409, 'upload_busy');
      if (outcome === 'rate_limited') return response(429, 'rate_limited');
      if (outcome !== 'reserved') return response(503, 'state_unavailable');
      if (await finish(claims.sub, key) !== 'validated') return response(503, 'state_unavailable');
      return new Response(JSON.stringify({ success: true, status: 'validation_only', authorized: true, validated: true,
        privacyStatus: 'private', request_id: requestId }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch {
      log.error('youtube gateway internal error', { request_id: requestId });
      return response(503, 'state_unavailable');
    }
  };
}
