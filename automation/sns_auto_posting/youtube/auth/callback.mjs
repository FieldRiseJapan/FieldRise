import { supabase } from './auth-client.mjs';
import { establishCallback } from './auth-flow.mjs';

try {
  const success = await establishCallback(supabase.auth, window.location, window.history);
  if (success) {
    window.location.replace('./index.html');
  } else {
    document.getElementById('callbackStatus').textContent = '認証を完了できませんでした。認証画面から再試行してください。';
  }
} catch {
  window.history.replaceState(null, '', window.location.pathname);
  document.getElementById('callbackStatus').textContent = '認証を完了できませんでした。認証画面から再試行してください。';
}
