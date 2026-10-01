import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
import { createHandler } from './handler.mjs';
import { uploadPrivate } from '../_shared/youtube-upload/core.mjs';

const url = Deno.env.get('SUPABASE_URL') || '';
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const allowedUserId = Deno.env.get('YOUTUBE_GATEWAY_ALLOWED_USER_ID') || '';
const auth = url && publishableKey ? createClient(url, publishableKey,
  { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const db = url && serviceKey ? createClient(url, serviceKey,
  { auth: { persistSession: false, autoRefreshToken: false } }) : null;

// Server-only opt-in. Missing flag preserves the deployed validation-only contract.
const realEnabled = Deno.env.get('YOUTUBE_GATEWAY_REAL_UPLOAD_ENABLED') === 'true' &&
  url === 'https://nmkcjtrllzkwjxmjromw.supabase.co';
const rpc = async (name: string, args: Record<string, unknown>) => {
  if (!db) throw new Error('state_unavailable');
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error('state_unavailable');
  return data;
};
const binding = (userId: string, key: string, channel: string, fingerprint: string) => ({
  p_user_id: userId, p_key: key, p_channel: channel, p_fingerprint: fingerprint,
});
const realUpload = realEnabled ? {
  channelId: Deno.env.get('YOUTUBE_ALLOWED_CHANNEL_ID') || '',
  store: {
    reserve: (u: string, k: string, c: string, f: string) => rpc('youtube_gateway_upload_reserve', binding(u,k,c,f)),
    begin: async (u: string, k: string, c: string, f: string) =>
      await rpc('youtube_gateway_upload_begin', binding(u,k,c,f)) === true,
    complete: async (u: string, k: string, c: string, f: string, state: string, videoId: string | null) =>
      await rpc('youtube_gateway_upload_complete', { ...binding(u,k,c,f), p_state: state, p_video_id: videoId }) === true,
  },
  upload: (input: { video: File; title: string; description: string; channelId: string }) => uploadPrivate({
    ...input, clientId: Deno.env.get('YOUTUBE_CLIENT_ID') || '',
    clientSecret: Deno.env.get('YOUTUBE_CLIENT_SECRET') || '',
    loadRefreshToken: async () => {
      if (!db) throw new Error('token_unavailable');
      const { data, error } = await db.from('youtube_oauth_tokens').select('refresh_token').eq('id', 1).single();
      if (error || !data?.refresh_token) throw new Error('token_unavailable');
      return data.refresh_token;
    },
  }),
} : null;

const handler = createHandler({
  allowedUserId,
  realUpload,
  verifyJwt: async (jwt: string) => {
    if (!auth) return null;
    // Supabase verifies signature, issuer and expiry. Never authorize decoded, unverified claims.
    const { data, error } = await auth.auth.getClaims(jwt);
    return error ? null : data?.claims;
  },
  reserve: async (userId: string, key: string) => {
    if (!db) return 'unavailable';
    const { data, error } = await db.rpc('youtube_gateway_reserve', { p_user_id: userId, p_key: key });
    return error ? 'unavailable' : data;
  },
  finish: async (userId: string, key: string) => {
    if (!db) return 'unavailable';
    const { data, error } = await db.rpc('youtube_gateway_finish', { p_user_id: userId, p_key: key });
    return error ? 'unavailable' : data;
  },
});

Deno.serve(handler);
