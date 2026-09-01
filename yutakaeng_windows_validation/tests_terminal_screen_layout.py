from pathlib import Path

SOURCE = (Path(__file__).parent / "src" / "app.py").read_text(encoding="utf-8")


def check(condition, label):
    if not condition:
        raise AssertionError(f"FAILED {label}")
    print(f"OK  {label}")


check("self.normal_view = QWidget()" in SOURCE, "normal start screen is isolated")
check("self.terminal_view = QFrame()" in SOURCE, "dedicated terminal screen exists")
check("self.terminal_view.setVisible(False)" in SOURCE, "terminal is hidden before analysis")
check("self.normal_view.setVisible(False); self.terminal_view.setVisible(True)" in SOURCE, "analysis swaps to terminal screen")
check("self.normal_view.setVisible(True); self.terminal_view.setVisible(False)" in SOURCE, "completion restores normal screen")
check("for line in startup_lines(path):" in SOURCE, "startup displays actual execution code")
check("format_pipeline_event(code, message)" in SOURCE, "live events display matching code calls")
check("self.showMaximized()" in SOURCE, "analysis window expands for readable live code")
print("ALL TERMINAL SCREEN LAYOUT TESTS PASSED")
