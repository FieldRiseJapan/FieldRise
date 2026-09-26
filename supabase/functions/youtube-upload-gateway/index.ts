import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
import { createHandler } from './handler.mjs';

const url = Deno.env.get('SUPABASE_URL') || '';
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const allowedUserId = Deno.env.get('YOUTUBE_GATEWAY_ALLOWED_USER_ID') || '';
const auth = url && publishableKey ? createClient(url, publishableKey,
  { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const db = url && serviceKey ? createClient(url, serviceKey,
  { auth: { persistSession: false, autoRefreshToken: false } }) : null;

const handler = createHandler({
  allowedUserId,
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
