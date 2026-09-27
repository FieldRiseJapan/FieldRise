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

// This RPC is a fail-closed boundary contract only. Its auth.sessions access model
// remains pending staging verification and is intentionally not implemented here.
const verifySession = async (userId: string, sessionId: string, transactionExpiresAt: string) => {
  if (!serviceClient) return false;
  const { data, error } = await serviceClient.rpc('youtube_oauth_verify_session', {
    p_user_id: userId,
    p_session_id: sessionId,
    p_transaction_expires_at: transactionExpiresAt,
  });
  return !error && data === true;
};
const repository = serviceClient
  ? createOAuthRepository(serviceClient, { sessionVerifier: verifySession })
  : null;

const handler = createCallbackHandler({
  allowedChannelId,
  lookupState: async (hash) => repository ? repository.lookupState(hash) : null,
  verifySession: (userId, sessionId, expiresAt) => repository
    ? repository.verifySession(userId, sessionId, expiresAt)
    : false,
  consumeState: async (hash) => repository ? repository.consumeState(hash) : null,
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
