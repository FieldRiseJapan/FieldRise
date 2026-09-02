from pathlib import Path
import sys

import fitz

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import extract_order_number, extract_panel_number, render_metadata

PDF = Path("/home/ubuntu/upload/20260824152536.pdf")
document = fitz.open(PDF)
image = render_metadata(document[3])
if image.shape[0] < 3000:
    raise AssertionError(f"metadata image needs high resolution, got height={image.shape[0]}")
actual = extract_panel_number(image)
order = extract_order_number(image)
if order != "25JNG38201W":
    raise AssertionError(f"page 4 high-resolution order: expected='25JNG38201W' actual={order!r}")
if actual != "3":
    raise AssertionError(f"page 4 high-resolution panel: expected='3' actual={actual!r}")
print("OK  high-resolution metadata rendering reads numeric-only panel 3 and order 25JNG38201W")
document.close()
