export const CALLBACK_FILE = 'callback.html';

export function callbackUrl(pageUrl) {
  return new URL(CALLBACK_FILE, pageUrl).href;
}

export async function sendMagicLink(auth, email, pageUrl, initialRegistration = false) {
  const address = String(email || '').trim();
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return false;
  const { error } = await auth.signInWithOtp({
    email: address,
    options: { emailRedirectTo: callbackUrl(pageUrl), shouldCreateUser: initialRegistration },
  });
  return !error;
}

export async function currentAuth(auth) {
  const { data: userData, error: userError } = await auth.getUser();
  if (userError || !userData?.user) return { signedIn: false, aal: 'none', next: 'none' };
  const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return { signedIn: true, aal: 'unknown', next: 'unknown' };
  return { signedIn: true, aal: data.currentLevel || 'unknown', next: data.nextLevel || 'unknown' };
}

export async function beginTotp(auth) {
  const { data, error } = await auth.mfa.enroll({ factorType: 'totp' });
  if (error || !data?.id || !data?.totp?.qr_code) return null;
  const qr = data.totp.qr_code;
  if (!/^data:image\/svg\+xml(?:;[^,]*)?,/i.test(qr)) return null;
  return { factorId: data.id, qr };
}

export async function verifiedTotpFactor(auth) {
  const { data, error } = await auth.mfa.listFactors();
  if (error) return null;
  return data?.totp?.find(f => f.status === 'verified')?.id || null;
}

export async function challengeAndVerify(auth, factorId, code) {
  if (!factorId || !/^\d{6,8}$/.test(String(code || '').trim())) return false;
  const { data: challenge, error: challengeError } = await auth.mfa.challenge({ factorId });
  if (challengeError || !challenge?.id) return false;
  const { error } = await auth.mfa.verify({ factorId, challengeId: challenge.id, code: String(code).trim() });
  return !error;
}

export async function establishCallback(auth, location, history) {
  try {
    // The default Magic Link template uses the implicit flow; the SDK consumes its URL fragment.
    const { data, error } = await auth.getSession();
    return !error && !!data?.session;
  } finally {
    // Never keep access/refresh tokens or an OAuth error in browser history.
    history.replaceState(null, '', location.pathname);
  }
}
