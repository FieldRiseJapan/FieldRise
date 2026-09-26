export const ALLOWED_ORIGIN = 'https://fieldrisejapan.github.io';
export const MAX_VIDEO_BYTES_PHASE1 = 2 * 1024 * 1024; // test-only; measure before real uploads
export const MAX_REQUEST_BYTES_PHASE1 = MAX_VIDEO_BYTES_PHASE1 + 16 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) { return typeof value === 'string' && uuid.test(value); }

export function authorize(claims, allowedUserId) {
  if (!isUuid(allowedUserId)) return 'unconfigured';
  if (!claims || claims.role !== 'authenticated' || claims.is_anonymous === true ||
      claims.aal !== 'aal2' || claims.sub !== allowedUserId) return 'forbidden';
  return null;
}

export function validateParts(form) {
  const counts = new Map();
  for (const [name] of form.entries()) {
    if (!['video', 'title', 'description'].includes(name)) return 'unknown_part';
    counts.set(name, (counts.get(name) || 0) + 1);
    if (counts.get(name) > 1) return 'duplicate_part';
  }
  const video = form.get('video');
  const title = form.get('title');
  const description = form.get('description');
  if (!(video instanceof File)) return 'video_required';
  if (!video.size || video.size > MAX_VIDEO_BYTES_PHASE1) return 'video_size';
  if (video.type !== 'video/mp4' || !/\.mp4$/i.test(video.name)) return 'video_type';
  if (typeof title !== 'string') return 'title_required';
  const cleanedTitle = title.trim();
  if (!cleanedTitle || [...cleanedTitle].length > 100 || /[<>]/.test(cleanedTitle)) return 'title_invalid';
  if (description !== null && (typeof description !== 'string' ||
      new TextEncoder().encode(description).length > 5000 || /[<>]/.test(description))) return 'description_invalid';
  return { video, title: cleanedTitle, description: description || '' };
}

export function corsHeaders(origin) {
  return origin === ALLOWED_ORIGIN ? {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, idempotency-key',
    'Access-Control-Max-Age': '300',
    'Vary': 'Origin',
  } : { 'Vary': 'Origin' };
}
