from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent
tests = [
    'tests_pipeline_rules.py',
    'tests_excel_layout.py',
    'tests_multipage_header_images.py',
    'tests_terminal_feed.py',
    'tests_terminal_screen_layout.py',
    'tests_panel_candidate_consensus.py',
    'tests_refined_ocr_consensus.py',
    'tests_accuracy_tuning_suite.py',
    'tests_github_ocr_assets.py',
]
for test in tests:
    print(f'=== {test} ===', flush=True)
    result = subprocess.run([sys.executable, str(root / test)], cwd=root)
    if result.returncode:
        raise SystemExit(result.returncode)
print(f'ALL {len(tests)} REGRESSION TESTS PASSED')
