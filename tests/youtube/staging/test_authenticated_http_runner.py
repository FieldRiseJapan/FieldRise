"""Offline safety tests; these do not prove live authenticated HTTP denial."""
import contextlib
import importlib.util
import io
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("runner", Path(__file__).with_name("verify_authenticated_http.py"))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class Transport:
    def __init__(self, allow=False, logout_failure=False):
        self.created = False
        self.deleted = False
        self.allow = allow
        self.logout_failure = logout_failure
        self.rpc_args = []

    def __call__(self, key, method, path, payload=None, bearer=None):
        if path.startswith("/auth/v1/admin/users?"):
            return 200, {"users": [] if not self.created or self.deleted else [{"id": "fixture"}]}
        if path == "/auth/v1/admin/users":
            self.created = True
            return 200, {"id": "fixture"}
        if path.startswith("/auth/v1/token"):
            return 200, {"access_token": "memory-placeholder", "user": {"id": "fixture"}}
        if path == "/auth/v1/user":
            return 200, {"id": "fixture", "role": "authenticated"}
        if path.startswith("/auth/v1/logout"):
            if self.logout_failure:
                raise runner.SafeFailure("transport failure")
            return 204, {}
        if path == "/auth/v1/admin/users/fixture" and method == "DELETE":
            self.deleted = True
            return 200, {}
        if path.startswith("/rest/v1/rpc/"):
            self.rpc_args.append(payload)
            return 403, {"code": "42501"}
        if method == "POST":
            assert payload == {"id": None, "refresh_token": None}
        if self.allow:
            return 200, []
        return 403, {"code": "42501"}


class SafetyTests(unittest.TestCase):
    def test_denials_cleanup_and_sanitized_output(self):
        transport, output = Transport(), io.StringIO()
        with contextlib.redirect_stdout(output):
            runner.run("local-placeholder", transport)
        self.assertTrue(transport.deleted)
        self.assertIn("AUTH_FIXTURE_CLEANUP 0", output.getvalue())
        for sensitive in ["local-placeholder", "memory-placeholder", "example.invalid"]:
            self.assertNotIn(sensitive, output.getvalue())
        self.assertEqual(set(transport.rpc_args[0]), {"p_transaction_id", "p_state_hash", "p_ttl_seconds"})
        self.assertEqual(set(transport.rpc_args[2]), {"p_transaction_id", "p_result_code"})

    def test_unexpected_allowed_response_still_deletes_user(self):
        transport = Transport(allow=True)
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(runner.SafeFailure):
            runner.run("local-placeholder", transport)
        self.assertTrue(transport.deleted)

    def test_logout_transport_failure_does_not_skip_user_deletion(self):
        transport = Transport(logout_failure=True)
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(runner.SafeFailure):
            runner.run("local-placeholder", transport)
        self.assertTrue(transport.deleted)


if __name__ == "__main__":
    unittest.main()
