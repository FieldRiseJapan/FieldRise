import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
import {
  createCallbackHandler,
  createGoogleProvider,
  createOAuthRepository,
} from '../_shared/youtube-oauth.mjs';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const clientId = Deno.env.get('YOUTUBE_CLIENT_ID') || '';
const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET') || '';
const allowedChannelId = Deno.env.get('YOUTUBE_ALLOWED_CHANNEL_ID') || '';

const serviceClient = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const google = createGoogleProvider({ clientId, clientSecret });

const repository = serviceClient ? createOAuthRepository(serviceClient) : null;

const handler = createCallbackHandler({
  allowedChannelId,
  consumeState: async (hash) => repository
    ? repository.consumeState(hash)
    : { status: 'unavailable' },
  exchangeAuthorizationCode: (code) => google.exchangeAuthorizationCode(code),
  getOwnedChannels: (accessToken) => google.getOwnedChannels(accessToken),
  cutoverToken: async (transactionId, refreshToken) => repository
    ? repository.cutoverToken(transactionId, refreshToken)
    : false,
  finish: async (transactionId, resultCode) => repository
    ? repository.finish(transactionId, resultCode)
    : false,
});

Deno.serve(handler);
