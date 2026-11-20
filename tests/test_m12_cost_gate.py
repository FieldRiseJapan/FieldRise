import subprocess
import unittest
from pathlib import Path

WORKFLOW = Path(__file__).resolve().parents[1] / ".github/workflows/momoka-auto-notify.yml"

class ManusCostGateTests(unittest.TestCase):
    def test_workflow_requires_explicit_per_run_authorization(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("default: false\n        type: boolean", text[text.index("allow_manus_task_creation:"):])
        self.assertIn('MANUS_TASK_AUTHORIZED: ${{ inputs.allow_manus_task_creation || false }}', text)
        gate = 'elif [[ "$MANUS_TASK_AUTHORIZED" != "true" ]]; then'
        key = 'elif [[ -z "$MANUS_API_KEY" ]]; then'
        create = "https://api.manus.ai/v2/task.create"
        self.assertLess(text.index(gate), text.index(key))
        self.assertLess(text.index(key), text.index(create))

    def test_gate_blocks_unless_explicitly_authorized(self):
        script = '''\nstatus=failed\nif [[ "$DRY_RUN" == "true" ]]; then\n  status=dry_run\nelif [[ "$MANUS_TASK_AUTHORIZED" != "true" ]]; then\n  status=blocked\nelif [[ -z "$MANUS_API_KEY" ]]; then\n  status=blocked\nelse\n  status=would_create\nfi\nprintf %s "$status"\n'''
        for dry, allowed, key, expected in [("false", "false", "present", "blocked"), ("false", "true", "present", "would_create"), ("false", "true", "", "blocked"), ("true", "true", "present", "dry_run")]:
            result = subprocess.run(["bash", "-eu", "-c", script], env={"DRY_RUN": dry, "MANUS_TASK_AUTHORIZED": allowed, "MANUS_API_KEY": key}, capture_output=True, text=True, check=True)
            self.assertEqual(result.stdout, expected)

if __name__ == "__main__":
    unittest.main()
