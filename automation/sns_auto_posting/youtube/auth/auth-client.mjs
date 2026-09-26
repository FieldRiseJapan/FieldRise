import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './public-config.mjs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: 'implicit', // matches the current default Magic Link email template
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'fieldrise-youtube-auth',
  },
});
