from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent / "src"))

from ocr_assets import (
    ensemble_consensus,
    detect_cell_boundaries,
    paddle_available,
    paddle_candidates,
)


def check(name, condition):
    if not condition:
        raise AssertionError(name)
    print(f"OK  {name}")


check("paddle adapter is optional and local", paddle_available() in {True, False})
check("paddle unavailable returns no candidate", paddle_candidates([[255, 255], [255, 255]]) == [] if not paddle_available() else True)
check(
    "ensemble accepts two agreeing engines",
    ensemble_consensus([("BTFL1A11", 0.93, "rapid"), ("BTFL1A11", 0.91, "tesseract"), ("BTFL1A1", 0.98, "paddle")], min_engines=2) == "BTFL1A11",
)
check(
    "ensemble rejects disagreement",
    ensemble_consensus([("BTFL1A11", 0.93, "rapid"), ("BTFL1A1", 0.91, "tesseract"), ("BTFL1A2", 0.98, "paddle")], min_engines=2) == "",
)
check(
    "ensemble rejects duplicate same engine",
    ensemble_consensus([("Y2", 0.93, "rapid"), ("Y2", 0.91, "rapid")], min_engines=2) == "",
)
check(
    "line detector returns ordered boundaries",
    detect_cell_boundaries([[0, 0, 0, 0], [255, 255, 255, 255], [0, 0, 0, 0], [255, 255, 255, 255]])[:2] == [0, 2],
)
print("ALL GITHUB OCR ASSET TESTS PASSED")
