import { validateMp4, isVideoId } from '../_shared/youtube-upload/core.mjs';

export async function fingerprint(data, channelId) {
  const videoHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await data.video.arrayBuffer()))]
    .map(n => n.toString(16).padStart(2, '0')).join('');
  const canonical = JSON.stringify([channelId, data.title, data.description, 'private', '10', false, videoHash]);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical)))]
    .map(n => n.toString(16).padStart(2, '0')).join('');
}

export async function runRealUpload({ data, userId, key, headers, response, store, upload, channelId }) {
  const reply = (state, videoId, status = 200) => new Response(JSON.stringify({
    authorized: true, validated: true, state, privacyStatus: 'private',
    ...(state === 'succeeded' && isVideoId(videoId) ? { videoId } : {}) }), {
    status, headers: { ...headers, 'Content-Type': 'application/json' } });
  try {
    if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId || '') || !store || !upload) return response(503, 'upload_unconfigured');
    if (!await validateMp4(data.video)) return response(422, 'video_invalid');
    const digest = await fingerprint(data, channelId);
    const reserved = await store.reserve(userId, key, channelId, digest);
    if (reserved?.decision === 'mismatch') return response(409, 'fingerprint_mismatch');
    if (reserved?.decision === 'busy') return response(409, 'channel_unresolved');
    if (reserved?.decision === 'rate_limited') return response(429, 'rate_limited');
    if (reserved?.decision === 'existing') {
      if (!['accepted', 'uploading', 'succeeded', 'failed', 'outcome_unknown'].includes(reserved.state))
        return response(503, 'state_unavailable');
      if (reserved.state === 'succeeded' && !isVideoId(reserved.videoId)) return response(503, 'state_unavailable');
      return reply(reserved.state, reserved.videoId, ['accepted', 'uploading', 'outcome_unknown'].includes(reserved.state) ? 202 : 200);
    }
    if (reserved?.decision !== 'accepted') return response(503, 'state_unavailable');
    // A committed DB CAS is required before crossing the provider boundary.
    if (!await store.begin(userId, key, channelId, digest)) return response(503, 'state_unavailable');
    let result;
    try { result = await upload({ ...data, channelId }); }
    catch { result = { state: 'outcome_unknown' }; }
    if (!['succeeded', 'failed', 'outcome_unknown'].includes(result?.state) ||
        (result.state === 'succeeded' && (!isVideoId(result.videoId) || result.privacyStatus !== 'private')))
      result = { state: 'outcome_unknown' };
    // On terminal persistence failure uploading remains unresolved in DB; no retry.
    if (!await store.complete(userId, key, channelId, digest, result.state,
      result.state === 'succeeded' ? result.videoId : null)) return response(503, 'state_unavailable');
    return reply(result.state, result.videoId, result.state === 'outcome_unknown' ? 202 : result.state === 'failed' ? 502 : 200);
  } catch { return response(503, 'state_unavailable'); }
}
