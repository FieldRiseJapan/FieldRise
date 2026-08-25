import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import exclusion_reason, extract_wire_codes


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}")


check(extract_wire_codes("RIGHT-Y5"), ["Y5"], "RIGHT cross-panel wire code")
check(extract_wire_codes("LEFT-Y5/RIGHT-Y5"), ["Y5"], "LEFT/RIGHT duplicate wire code")
check(extract_wire_codes("T1:1-Y2"), ["Y2"], "wire code after terminal reference")
check(extract_wire_codes("5Y"), ["5Y"], "size-first wire code")
check(extract_wire_codes("YF-A01"), [], "connector terminal reference excluded")
check(exclusion_reason("DT1 (2)", "", ""), "対象外: 扉付きDT系端子台", "DT terminal block excluded")
check(exclusion_reason("T1 (2)", "D-Y0.5", ""), "対象外: 線コードがD-で始まる", "D-prefixed wire code excluded")
check(exclusion_reason("T1 (2)", "I/L", ""), "対象外: 端子台接続先のIは盤内行き", "internal-panel I excluded")
check(exclusion_reason("ZT1 (14)", "RIGHT-Y5", "T1-1"), "", "ZT RIGHT remains included")
print("ALL RULE TESTS PASSED")
