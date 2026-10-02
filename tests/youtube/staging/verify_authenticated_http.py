"""Owner-local Staging-only Auth/PostgREST denial proof. No credential files/logs.

Run interactively after checking Staging health/Free status. Paste the EXISTING
Staging server API key into the hidden local prompt, never chat or command flags.
Uses official Auth create/password sign-in/logout/delete APIs; no Auth config edits.
Runtime execution is still required; merely committing this runner is not proof.
"""
import getpass
import json
import secrets
import sys
import urllib.error
import urllib.request

BASE = "https://zjgmgwjeebphkbbqjbfi.supabase.co"


class SafeFailure(Exception):
    pass


def request(key, method, path, payload=None, bearer=None):
    headers = {"apikey": key, "Content-Type": "application/json", "Prefer": "return=minimal"}
    if bearer:
        headers["Authorization"] = "Bearer " + bearer
    elif key.startswith("eyJ"):
        headers["Authorization"] = "Bearer " + key
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            status, body = response.status, response.read(1_000_000)
    except urllib.error.HTTPError as error:
        status, body = error.code, error.read(1_000_000)
    except Exception:
        raise SafeFailure("HTTP transport failed; credential details suppressed") from None
    try:
        parsed = json.loads(body) if body else {}
    except (ValueError, UnicodeError):
        raise SafeFailure("Unexpected response format; body suppressed") from None
    return status, parsed


def run(key, call=request):
    user_id = access = None
    failure = None
    status, users = call(key, "GET", "/auth/v1/admin/users?page=1&per_page=1000")
    if status != 200 or users.get("users") != []:
        raise SafeFailure("Requires working Staging admin auth and zero initial Auth fixtures")
    email = "fieldrise-test-" + secrets.token_hex(12) + "@example.invalid"
    password = secrets.token_urlsafe(32)
    try:
        status, created = call(key, "POST", "/auth/v1/admin/users",
                               {"email": email, "password": password, "email_confirm": True})
        user_id = created.get("id") if status in (200, 201) else None
        if not user_id:
            raise SafeFailure("Auth create failed; response suppressed")
        status, session = call(key, "POST", "/auth/v1/token?grant_type=password",
                               {"email": email, "password": password})
        access = session.get("access_token") if status == 200 else None
        if not access or session.get("user", {}).get("id") != user_id:
            raise SafeFailure("Real authenticated session unavailable")
        status, user = call(key, "GET", "/auth/v1/user", bearer=access)
        if status != 200 or user.get("id") != user_id or user.get("role") != "authenticated":
            raise SafeFailure("Authenticated role/identity verification failed")
        # Filters guarantee no pre-existing row can be changed if an ACL unexpectedly fails.
        fixture_id = -(secrets.randbelow(2**50) + 1)
        # NOT NULL values deliberately invalid: even unexpected INSERT permission
        # cannot persist a token fixture. Permission denial must still be 42501.
        body = {"id": None, "refresh_token": None}
        operations = [("SELECT", "GET", "/rest/v1/youtube_oauth_tokens?select=refresh_token&limit=0", None),
                      ("INSERT", "POST", "/rest/v1/youtube_oauth_tokens", body),
                      ("UPDATE", "PATCH", f"/rest/v1/youtube_oauth_tokens?id=eq.{fixture_id}",
                       {"refresh_token": secrets.token_urlsafe(32)}),
                      ("DELETE", "DELETE", f"/rest/v1/youtube_oauth_tokens?id=eq.{fixture_id}", None)]
        try:
            for label, method, path, payload in operations:
                status, result = call(key, method, path, payload, bearer=access)
                if status != 403 or result.get("code") != "42501":
                    raise SafeFailure("Token-table HTTP denial not proven: " + label)
                print(label + " DENIED HTTP403 42501")
            rpc_args = {
                "youtube_oauth_reserve": {"p_transaction_id": None, "p_state_hash": None, "p_ttl_seconds": None},
                "youtube_oauth_consume_state": {"p_state_hash": None},
                "youtube_oauth_finish": {"p_transaction_id": None, "p_result_code": None},
                "youtube_oauth_cutover_token": {"p_transaction_id": None, "p_refresh_token": None},
            }
            for name, args in rpc_args.items():
                status, result = call(key, "POST", "/rest/v1/rpc/" + name, args, bearer=access)
                if (status, result.get("code")) not in ((403, "42501"), (404, "PGRST202")):
                    raise SafeFailure("Sensitive RPC denial not proven; details suppressed")
                print("SENSITIVE_RPC DENIED HTTP" + str(status) + " " + result["code"])
        finally:
            # No token row was created: INSERT has NULL PK/NOT NULL token, all
            # UPDATE/DELETE filters use a synthetic negative ID and initial store is empty.
            pass
    except SafeFailure as error:
        failure = error
    finally:
        cleanup_ok = True
        if access:
            try:
                status, _ = call(key, "POST", "/auth/v1/logout?scope=global", bearer=access)
                cleanup_ok = status in (200, 204)
            except Exception:
                cleanup_ok = False
        if user_id:
            try:
                status, _ = call(key, "DELETE", "/auth/v1/admin/users/" + user_id)
                cleanup_ok = cleanup_ok and status in (200, 204)
            except Exception:
                cleanup_ok = False
        status, users = call(key, "GET", "/auth/v1/admin/users?page=1&per_page=1000")
        if not cleanup_ok or status != 200 or users.get("users") != []:
            raise SafeFailure("AUTH CLEANUP FAILED; stop and review Staging")
        print("AUTH_FIXTURE_CLEANUP 0")
    if failure:
        raise failure


if __name__ == "__main__":
    try:
        if not sys.stdin.isatty():
            raise SafeFailure("Interactive hidden local credential prompt required")
        run(getpass.getpass("Existing STAGING server API key (hidden, memory only): "))
    except Exception as error:
        # Never traceback transport/response/credential objects.
        print(str(error) if isinstance(error, SafeFailure) else "Test failed; details suppressed")
        sys.exit(1)
