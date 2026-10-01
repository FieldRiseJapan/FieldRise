"""B9C opt-in Staging HTTP probe; credentials enter through stdin, never logs.

Input JSON: project_ref, publishable_key, optional authenticated_jwt.
Use only a newly created Staging fixture JWT for the optional role probe.
No service key, provider communication, response body logging, or production.
"""
import base64
import json
import re
import secrets
import sys
import urllib.error
import urllib.request
import uuid

STAGING_REF = "zjgmgwjeebphkbbqjbfi"
BASE = f"https://{STAGING_REF}.supabase.co/rest/v1"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        return None


def contains_token_field(value):
    if isinstance(value, dict):
        return any(k in ("refresh_token", "access_token") or contains_token_field(v) for k, v in value.items())
    if isinstance(value, list):
        return any(contains_token_field(v) for v in value)
    return False


def run(config):
    if config.get("project_ref") != STAGING_REF:
        raise ValueError("STAGING_IDENTITY_MISMATCH")
    key = config.get("publishable_key", "")
    if not key.startswith("sb_publishable_"):
        raise ValueError("PUBLISHABLE_KEY_REQUIRED")
    opener = urllib.request.build_opener(NoRedirect())
    roles = [("anon", None)]
    jwt = config.get("authenticated_jwt")
    if jwt:
        claims = json.loads(base64.urlsafe_b64decode(jwt.split(".")[1] + "=="))
        if claims.get("role") != "authenticated" or claims.get("iss") != f"https://{STAGING_REF}.supabase.co/auth/v1":
            raise ValueError("STAGING_FIXTURE_JWT_REQUIRED")
        roles.append(("authenticated", jwt))

    for role, bearer in roles:
        dummy = secrets.token_urlsafe(32)
        transaction = str(uuid.uuid4())
        digest = "\\x" + secrets.token_hex(32)
        cases = [
            ("token_select", "GET", "/youtube_oauth_tokens?select=id,refresh_token,updated_at", None),
            ("token_insert", "POST", "/youtube_oauth_tokens", {"id": 1, "refresh_token": dummy}),
            ("token_update", "PATCH", "/youtube_oauth_tokens?id=eq.1", {"refresh_token": dummy}),
            ("token_delete", "DELETE", "/youtube_oauth_tokens?id=eq.1", None),
            ("rpc_reserve", "POST", "/rpc/youtube_oauth_reserve", {"p_transaction_id": transaction, "p_state_hash": digest, "p_ttl_seconds": 60}),
            ("rpc_consume", "POST", "/rpc/youtube_oauth_consume_state", {"p_state_hash": digest}),
            ("rpc_finish", "POST", "/rpc/youtube_oauth_finish", {"p_transaction_id": transaction, "p_result_code": "provider_denied"}),
            ("rpc_cutover", "POST", "/rpc/youtube_oauth_cutover_token", {"p_transaction_id": transaction, "p_refresh_token": dummy}),
        ]
        for label, method, path, payload in cases:
            headers = {"apikey": key, "Content-Type": "application/json", "Prefer": "return=minimal", "Origin": "http://localhost:3000"}
            if bearer:
                headers["Authorization"] = "Bearer " + bearer
            request = urllib.request.Request(BASE + path, data=None if payload is None else json.dumps(payload).encode(), headers=headers, method=method)
            try:
                with opener.open(request, timeout=20) as response:
                    status, body = response.status, response.read()
            except urllib.error.HTTPError as error:
                status, body = error.code, error.read()
            except Exception:
                print(json.dumps({"role": role, "case": label, "result": "HTTP_UNAVAILABLE"}), flush=True)
                return 2
            raw = body.decode("utf-8", errors="replace")
            try:
                parsed = json.loads(raw)
                code = parsed.get("code") if isinstance(parsed, dict) else None
            except ValueError:
                parsed = None
                code = None
            if not isinstance(code, str) or not re.fullmatch(r"[A-Z0-9]{5,10}", code):
                code = None
            token_free = dummy not in raw and key not in raw and (not bearer or bearer not in raw) and not contains_token_field(parsed)
            denied = status in (401, 403) and code == "42501"
            print(json.dumps({"role": role, "case": label, "status": status, "code": code, "denied": denied, "response_credential_free": token_free}), flush=True)
            if not denied or not token_free:
                return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run(json.loads(sys.stdin.readline())))
    except (ValueError, KeyError, IndexError):
        print(json.dumps({"result": "SAFE_INPUT_VALIDATION_FAILED"}), flush=True)
        sys.exit(2)
