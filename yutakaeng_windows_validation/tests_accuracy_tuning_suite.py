from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import (
    calibrate_frame_geometry,
    normalize_ocr_confusions,
    select_ensemble_candidate,
    should_recover_wire_codes,
    structural_consensus,
    wire_size_candidates,
    wire_codes_from_ocr_texts,
)


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}")


check(wire_size_candidates("R-Y2", "LEFT-Y5", "W0.5"), ["2", "5", "0.5"], "dedicated wire-size candidates")
check(wire_size_candidates("R-Y2", "X2Y", "T1:4"), ["2"], "terminal noise is not a wire size")
check(wire_codes_from_ocr_texts(["T1:6", "R-Y2", "X2Y", "LEFT-Y5"]), ["Y2", "Y5"], "all detected OCR text contributes wire codes")
check(normalize_ocr_confusions("R-YO2", "wire_code"), "R-Y02", "limited O/0 correction is field scoped")
check(normalize_ocr_confusions("T1:I", "reference"), "T1:1", "limited I/1 correction is field scoped")
check(normalize_ocr_confusions("R-YO2", "main_text"), "R-YO2", "main text is not blindly corrected")
check(structural_consensus(["Y2", "Y2", "Y5"], lambda value: value in {"Y2", "Y5"}), "Y2", "structure consensus selects repeated candidate")
check(structural_consensus(["Y2", "Y5"], lambda value: value in {"Y2", "Y5"}), "", "structure conflict remains warning")
check(calibrate_frame_geometry((100, 200, 500, 300), (1000, 1200), (8, 6)), (92, 194, 516, 312), "frame geometry is expanded and clamped")
check(select_ensemble_candidate(("Y2", 0.96), ("Y2", 0.91), lambda value, score: score >= 0.85), "Y2", "independent OCR agreement is accepted")
check(select_ensemble_candidate(("Y2", 0.96), ("Y5", 0.99), lambda value, score: score >= 0.85), "", "independent OCR conflict remains warning")
check(should_recover_wire_codes(["Y2"]), False, "wire recovery skips already classified rows")
check(should_recover_wire_codes([]), True, "wire recovery runs only for unresolved rows")
print("ALL ACCURACY TUNING TESTS PASSED")
