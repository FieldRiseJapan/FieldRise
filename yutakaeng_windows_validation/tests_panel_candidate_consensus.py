from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import panel_candidate_from_values


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}")


check(panel_candidate_from_values(["MITSUBISHI", "3A", "左右側面線表", "3A"]), "3A", "panel value is isolated from title text")
check(panel_candidate_from_values(["2A", "2A", "2A", "MITSUBISHI"]), "2A", "matching candidates are accepted")
check(panel_candidate_from_values(["3A", "3A", "3"]), "3A", "specific panel value wins over partial value")
check(panel_candidate_from_values(["3A", "2A", "MITSUBISHI"]), "", "conflicting single candidates are not guessed")
check(panel_candidate_from_values(["MITSUBISHI", "左右側面線表", "TITLE"]), "", "non-panel title text is rejected")
check(panel_candidate_from_values(["1A(2)", "1A(2)", "1A"]), "1A(2)", "page-suffix panel format is retained")
check(panel_candidate_from_values(["3", "3", "MITSUBISHI"]), "3", "repeated numeric-only panel format is retained")
check(panel_candidate_from_values(["3", "MITSUBISHI"]), "", "single numeric value is not guessed")
print("ALL PANEL CANDIDATE TESTS PASSED")
