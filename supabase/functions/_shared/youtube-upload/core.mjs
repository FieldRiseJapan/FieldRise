// Server-only. Credentials and resumable URLs remain in this call's memory.
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INSERT_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status&notifySubscribers=false';
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);
export const isVideoId = safeId;

export async function validateMp4(video) {
  const bytes = new Uint8Array(await video.slice(0, 32).arrayBuffer());
  if (bytes.length < 16) return false;
  const size = new DataView(bytes.buffer).getUint32(0);
  return size >= 16 && size <= video.size && size % 4 === 0 &&
    String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp' &&
    /^(isom|iso[2-9]|mp4[12]|avc1|M4V )$/.test(String.fromCharCode(...bytes.slice(8, 12)));
}

export async function uploadPrivate({ video, title, description, channelId, clientId, clientSecret,
  loadRefreshToken, fetchImpl = fetch }) {
  let providerReached = false;
  const failed = () => ({ state: 'failed' });
  const uncertain = () => ({ state: 'outcome_unknown' });
  // One network attempt per stage. Redirects/retries are never followed.
  const call = (url, options) => fetchImpl(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000) });
  try {
    if (!clientId || !clientSecret || !/^UC[A-Za-z0-9_-]{22}$/.test(channelId || '') ||
        !video || video.type !== 'video/mp4' || !/\.mp4$/i.test(video.name || '') ||
        !video.size || video.size > 2 * 1024 * 1024 || typeof title !== 'string' ||
        !title.trim() || [...title].length > 100 || /[<>\u0000]/.test(title) ||
        typeof description !== 'string' || new TextEncoder().encode(description).length > 5000 ||
        /[<>\u0000]/.test(description) ||
        !await validateMp4(video)) return failed();
    const refreshToken = await loadRefreshToken();
    if (typeof refreshToken !== 'string' || !refreshToken.trim()) return failed();
    const refreshed = await call(TOKEN_URL, { method: 'POST', headers: {
      'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }) });
    if (!refreshed.ok) return failed();
    const token = await refreshed.json();
    if (typeof token.access_token !== 'string' || !token.access_token || /[\r\n]/.test(token.access_token)) return failed();
    // Verify the actual refreshed credential's channel before any videos.insert.
    const channels = await call('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
      headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!channels.ok) return failed();
    const channel = await channels.json();
    if (!Array.isArray(channel.items) || channel.items.length !== 1 || channel.items[0]?.id !== channelId ||
        (channel.pageInfo?.totalResults !== undefined && channel.pageInfo.totalResults !== 1) || channel.nextPageToken) return failed();
    const metadata = { snippet: { title, description, categoryId: '10' },
      status: { privacyStatus: 'private', selfDeclaredMadeForKids: false } };
    providerReached = true;
    const init = await call(INSERT_URL, { method: 'POST', headers: {
      Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(video.size), 'X-Upload-Content-Type': 'video/mp4' }, body: JSON.stringify(metadata) });
    // Even initialization failures are conservatively unresolved once insert may have reached Google.
    if (!init.ok) return uncertain();
    const location = new URL(init.headers.get('location') || '');
    if (location.protocol !== 'https:' || location.hostname !== 'www.googleapis.com' || location.port ||
        location.username || location.password || location.hash || location.pathname !== '/upload/youtube/v3/videos' ||
        location.searchParams.get('uploadType') !== 'resumable' || !location.searchParams.get('upload_id')) return uncertain();
    const uploaded = await call(location.href, { method: 'PUT', headers: {
      'Content-Type': 'video/mp4', 'Content-Length': String(video.size) }, body: await video.arrayBuffer() });
    if (!uploaded.ok) return uncertain();
    const result = await uploaded.json();
    if (!safeId(result.id) || result.status?.privacyStatus !== 'private' || result.snippet?.channelId !== channelId) return uncertain();
    return { state: 'succeeded', videoId: result.id, privacyStatus: 'private' };
  } catch {
    return providerReached ? uncertain() : failed();
  }
}
