from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import collect_ocr_candidates, main_candidate_is_safe, side_candidate_is_safe, stable_safe_candidate


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}")


images = [bytearray([0]), bytearray([1]), bytearray([2])]
result_map = {0: ("D31S14", 0.97), 1: ("D31S14", 0.96), 2: ("D31S1", 0.94)}
candidates = collect_ocr_candidates(images, lambda image: result_map[image[0]], lambda value: value)
check(candidates, [("D31S14", 0.97), ("D31S14", 0.96), ("D31S1", 0.94)], "all enhanced OCR results are retained")
check(stable_safe_candidate(candidates, main_candidate_is_safe), "D31S14", "matching safe main text is adopted")
check(stable_safe_candidate([("D31S14", 0.97), ("C711S11", 0.98)], main_candidate_is_safe), "", "conflicting main text is kept as warning")
check(stable_safe_candidate([("RIGHT-Y5", 0.95), ("RIGHT-Y5", 0.94), ("RIGHT-Y51", 0.99)], side_candidate_is_safe), "RIGHT-Y5", "matching safe side reference is adopted")
check(stable_safe_candidate([("7T2:4-Y2", 0.99), ("7T2:4-Y2", 0.99)], side_candidate_is_safe), "", "unsafe side reference is rejected")
print("ALL REFINED OCR CONSENSUS TESTS PASSED")
