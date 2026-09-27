import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
import { createOAuthRepository, createStartHandler, verifyCurrentStartUser } from '../_shared/youtube-oauth.mjs';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const publicKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const allowedUserId = Deno.env.get('YOUTUBE_GATEWAY_ALLOWED_USER_ID') || '';
const clientId = Deno.env.get('YOUTUBE_CLIENT_ID') || '';

const authClient = supabaseUrl && publicKey
  ? createClient(supabaseUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const serviceClient = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const repository = serviceClient ? createOAuthRepository(serviceClient) : null;

const handler = createStartHandler({
  allowedUserId,
  clientId,
  verifyJwt: (jwt: string) => verifyCurrentStartUser(authClient, jwt),
  reserve: async (input) => repository ? repository.reserve(input) : false,
});

Deno.serve(handler);
