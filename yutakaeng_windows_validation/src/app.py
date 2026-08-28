from __future__ import annotations

import sys
import time
import webbrowser
from pathlib import Path

from PySide6.QtCore import QMimeData, QObject, QThread, QTimer, Qt, Signal
from PySide6.QtGui import QColor, QDragEnterEvent, QDropEvent, QFont, QPalette
from PySide6.QtWidgets import (
    QApplication, QFileDialog, QFrame, QHBoxLayout, QLabel, QMainWindow,
    QMessageBox, QPlainTextEdit, QProgressBar, QPushButton, QVBoxLayout, QWidget,
)

from pipeline import desktop_path, run_pipeline


class DropZone(QFrame):
    pdf_selected = Signal(str)

    def __init__(self) -> None:
        super().__init__()
        self.setAcceptDrops(True)
        self.setObjectName("dropZone")
        self.setMinimumHeight(220)
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.icon = QLabel("PDF")
        self.icon.setObjectName("pdfIcon")
        self.icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title = QLabel("配線図PDFをここにドラッグ＆ドロップ")
        self.title.setObjectName("dropTitle")
        self.title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.detail = QLabel("1つの複数ページPDFを選択してください。解析候補は確認用Excelとしてデスクトップへ出力します。")
        self.detail.setObjectName("dropDetail")
        self.detail.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.detail.setWordWrap(True)
        layout.addWidget(self.icon); layout.addWidget(self.title); layout.addWidget(self.detail)

    def dragEnterEvent(self, event: QDragEnterEvent) -> None:
        urls = event.mimeData().urls()
        if urls and urls[0].isLocalFile() and urls[0].toLocalFile().lower().endswith(".pdf"):
            event.acceptProposedAction()
            self.setProperty("dragging", True); self.style().unpolish(self); self.style().polish(self)

    def dragLeaveEvent(self, event) -> None:
        self.setProperty("dragging", False); self.style().unpolish(self); self.style().polish(self)

    def dropEvent(self, event: QDropEvent) -> None:
        urls = event.mimeData().urls()
        self.setProperty("dragging", False); self.style().unpolish(self); self.style().polish(self)
        if urls and urls[0].isLocalFile():
            path = urls[0].toLocalFile()
            if path.lower().endswith(".pdf"):
                self.pdf_selected.emit(path)
                event.acceptProposedAction()


class Worker(QObject):
    log = Signal(str, str)
    progress = Signal(int, int)
    completed = Signal(str)
    failed = Signal(str)

    def __init__(self, path: str, internal_only: bool = False) -> None:
        super().__init__()
        self.path = path
        self.internal_only = internal_only

    def run(self) -> None:
        try:
            result = run_pipeline(self.path, self.log.emit, self.progress.emit, internal_only=self.internal_only)
            self.completed.emit(str(result))
        except Exception as exc:
            self.failed.emit(str(exc))


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("yutakaeng | 配線図PDF 検証アプリ")
        self.setMinimumSize(980, 760)
        self._started_at = 0.0
        self._done = 0
        self._total = 1
        self._last_progress_at = 0.0
        self._last_done = 0
        self._seconds_per_page = 8.0
        self._estimated_total_seconds = 8.0
        self._thread: QThread | None = None
        self._worker: Worker | None = None
        self._input_path: Path | None = None
        self._review_dir: Path | None = None
        self._last_output_path: Path | None = None
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_timer)
        self.timer.setInterval(250)
        self.build_ui()
        self.apply_style()

    def build_ui(self) -> None:
        root = QWidget(); self.setCentralWidget(root)
        layout = QVBoxLayout(root); layout.setContentsMargins(34, 26, 34, 30); layout.setSpacing(16)
        header = QHBoxLayout()
        brand = QLabel("yutakaeng")
        brand.setObjectName("brand")
        subtitle = QLabel("WIRING PDF  /  VALIDATION BUILD")
        subtitle.setObjectName("subtitle")
        header.addWidget(brand); header.addWidget(subtitle); header.addStretch()
        self.status = QLabel("READY  PDFを選択してください")
        self.status.setObjectName("status")
        header.addWidget(self.status)
        layout.addLayout(header)

        self.drop_zone = DropZone(); self.drop_zone.pdf_selected.connect(self.start_analysis)
        layout.addWidget(self.drop_zone)
        controls = QHBoxLayout()
        self.choose_button = QPushButton("PDFを選択")
        self.choose_button.clicked.connect(self.choose_pdf)
        self.internal_button = QPushButton("盤内線")
        self.internal_button.setObjectName("internalButton")
        self.internal_button.setToolTip("I表記の盤内線だけを抽出してExcelへ出力")
        self.internal_button.clicked.connect(self.choose_internal_pdf)
        self.copilot_button = QPushButton("Copilotへ警告セルを確認依頼")
        self.copilot_button.setObjectName("copilotButton")
        self.copilot_button.clicked.connect(self.open_copilot_help)
        self.copilot_button.setVisible(False)
        controls.addStretch(); controls.addWidget(self.choose_button); controls.addWidget(self.internal_button); controls.addWidget(self.copilot_button); controls.addStretch()
        layout.addLayout(controls)

        self.completion_banner = QLabel("解析完了！")
        self.completion_banner.setObjectName("completionBanner")
        self.completion_banner.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.completion_banner.setVisible(False)
        layout.addWidget(self.completion_banner)

        progress_box = QFrame(); progress_box.setObjectName("progressBox")
        progress_layout = QVBoxLayout(progress_box)
        labels = QHBoxLayout()
        self.phase_label = QLabel("待機中")
        self.eta_label = QLabel("推定残り --:--")
        labels.addWidget(self.phase_label); labels.addStretch(); labels.addWidget(self.eta_label)
        self.progress = QProgressBar(); self.progress.setRange(0, 100); self.progress.setValue(0); self.progress.setTextVisible(True)
        self.counter_label = QLabel("ページ 0 / 0   |   経過 00:00")
        self.counter_label.setObjectName("counter")
        progress_layout.addLayout(labels); progress_layout.addWidget(self.progress); progress_layout.addWidget(self.counter_label)
        layout.addWidget(progress_box)

        log_title = QLabel("● LIVE PIPELINE  /  LOCAL OCR  /  NO CLOUD UPLOAD")
        log_title.setObjectName("logTitle")
        layout.addWidget(log_title)
        self.log_view = QPlainTextEdit()
        self.log_view.setReadOnly(True); self.log_view.setObjectName("logView")
        self.log_view.setMaximumBlockCount(500)
        layout.addWidget(self.log_view, stretch=1)
        self.append_log("SYSTEM_READY", "PDFをドロップすると検証パイプラインを開始します。")

    def apply_style(self) -> None:
        self.setStyleSheet("""
        QMainWindow { background: #071421; color: #e7f4ff; }
        QWidget { font-family: 'Yu Gothic UI', 'Meiryo', sans-serif; }
        #brand { color: #55b6ff; font-size: 28px; font-weight: 700; letter-spacing: 2px; }
        #subtitle { color: #7294af; font-size: 11px; margin-left: 14px; letter-spacing: 1px; }
        #status { background: #0e2940; color: #79c7ff; border: 1px solid #215171; border-radius: 12px; padding: 7px 12px; font-size: 11px; }
        #dropZone { background: #0a1c2d; border: 2px dashed #276a96; border-radius: 18px; }
        #dropZone[dragging="true"] { background: #0e2d49; border: 2px solid #55b6ff; }
        #pdfIcon { color: #55b6ff; border: 1px solid #388bc2; border-radius: 9px; padding: 10px; font-size: 18px; font-weight: 700; max-width: 58px; }
        #dropTitle { color: #f0f8ff; font-size: 22px; font-weight: 600; margin-top: 9px; }
        #dropDetail { color: #8ca9bd; font-size: 12px; margin: 6px 70px 0 70px; }
        QPushButton { background: #1679bc; color: white; border: 0; border-radius: 7px; padding: 10px 30px; font-size: 14px; font-weight: 600; }
        QPushButton:hover { background: #2394dc; }
        #copilotButton { background: #5b4cc4; }
        #copilotButton:hover { background: #7464e8; }
        #internalButton { background: #0b9b78; }
        #internalButton:hover { background: #18bd95; }
        QPushButton:disabled { background: #254157; color: #7991a0; }
        #progressBox { background: #0a1c2d; border: 1px solid #1d4059; border-radius: 10px; padding: 8px; }
        QProgressBar { background: #071421; border: 1px solid #24516e; border-radius: 6px; height: 16px; color: #e8f5ff; text-align: center; }
        QProgressBar::chunk { background: #1686d1; border-radius: 5px; }
        #counter, #eta_label { color: #86aabd; font-size: 12px; }
        #logTitle { color: #6cbefa; font-size: 13px; font-weight: 700; letter-spacing: 2px; padding: 4px 0; }
        #logView { background: #02070d; border: 1px solid #2c789f; border-radius: 8px; color: #9ae6ad; font-family: Consolas, 'Cascadia Mono', monospace; font-size: 13px; padding: 12px; selection-background-color: #174c65; }
        #completionBanner { background: #0b3d2b; color: #50f58b; border: 2px solid #2bdc78; border-radius: 12px; font-size: 34px; font-weight: 800; padding: 14px; letter-spacing: 4px; }
        """)

    def append_log(self, code: str, message: str) -> None:
        stamp = time.strftime("%H:%M:%S")
        self.log_view.appendPlainText(f"[{stamp}] {code:<20} {message}")
        bar = self.log_view.verticalScrollBar(); bar.setValue(bar.maximum())

    def choose_pdf(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "配線図PDFを選択", str(Path.home()), "PDF files (*.pdf)")
        if path: self.start_analysis(path, internal_only=False)

    def choose_internal_pdf(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "盤内線用PDFを選択（I表記のみ）", str(Path.home()), "PDF files (*.pdf)")
        if path: self.start_analysis(path, internal_only=True)

    def start_analysis(self, path: str, internal_only: bool = False) -> None:
        if self._thread and self._thread.isRunning():
            return
        self._input_path = Path(path)
        self._review_dir = None
        self._last_output_path = None
        self.completion_banner.setVisible(False)
        self.copilot_button.setVisible(False)
        self.internal_button.setDisabled(True)
        self.choose_button.setDisabled(True); self.drop_zone.setDisabled(True)
        self.drop_zone.setVisible(False); self.choose_button.setVisible(False); self.internal_button.setVisible(False)
        self.progress.setValue(0); self._done, self._total = 0, 1
        self._last_done = 0; self._last_progress_at = time.monotonic()
        self._seconds_per_page = 8.0; self._estimated_total_seconds = 8.0
        self._started_at = time.monotonic(); self.timer.start()
        self.status.setText("RUNNING  PDF解析中")
        self.phase_label.setText(f"解析開始: {Path(path).name}")
        self.append_log("PDF_ACCEPTED", f"入力: {path}")
        self.append_log("PIPELINE_START", "OCR候補抽出・除外判定・電線サイズ別Excel出力を開始")
        if internal_only:
            self.append_log("INTERNAL_WIRE_MODE", "盤内線モード / I表記だけを抽出")
        self.append_log("SECURITY_MODE", "LOCAL ONLY / PDF画像は外部送信しません")
        self.append_log("DISPLAY_MODE", "FULL SCREEN TERMINAL / 警告行のみ確認")
        if internal_only:
            self.append_log("TARGET_FILTER", "対象: I表記の盤内線のみ / 通常解析の除外ルールは維持")
        self._thread = QThread(self); self._worker = Worker(path, internal_only=internal_only); self._worker.moveToThread(self._thread)
        self._thread.started.connect(self._worker.run)
        self._worker.log.connect(self.append_log); self._worker.progress.connect(self.on_progress)
        self._worker.completed.connect(self.on_complete); self._worker.failed.connect(self.on_failure)
        self._worker.completed.connect(self._thread.quit); self._worker.failed.connect(self._thread.quit)
        self._thread.finished.connect(self.cleanup_thread)
        self._thread.start()

    def on_progress(self, done: int, total: int) -> None:
        now = time.monotonic()
        total = max(1, total)
        if done > self._last_done and self._last_progress_at:
            elapsed_since = max(0.05, now - self._last_progress_at)
            per_page = elapsed_since / (done - self._last_done)
            # 初期値から急変しないよう、観測値を平滑化する。
            self._seconds_per_page = 0.65 * self._seconds_per_page + 0.35 * per_page
        self._done, self._total = done, total
        self._last_done, self._last_progress_at = done, now
        self._estimated_total_seconds = max(1.0, self._seconds_per_page * total)
        value = int(done / total * 100)
        self.progress.setValue(value); self.phase_label.setText(f"ページ解析 {done} / {total}")
        self.update_timer()

    def update_timer(self) -> None:
        if not self._started_at:
            return
        elapsed_float = time.monotonic() - self._started_at
        elapsed = max(0, int(elapsed_float))
        if self._total > 0:
            remaining = max(1, int(self._estimated_total_seconds - elapsed_float)) if self._done < self._total else 0
            remain = f"{remaining // 60:02}:{remaining % 60:02}"
        else:
            remain = "計算中"
        self.counter_label.setText(f"ページ {self._done} / {self._total}   |   経過 {elapsed // 60:02}:{elapsed % 60:02}")
        self.eta_label.setText(f"推定残り {remain}")

    def on_complete(self, result: str) -> None:
        self.timer.stop(); self.progress.setValue(100); self._done = self._total; self.update_timer(); self.eta_label.setText("推定残り 00:00"); self.status.setText("COMPLETE  Excel出力済み")
        self._last_output_path = Path(result)
        self.completion_banner.setText("解析完了！")
        self.completion_banner.setVisible(True)
        if self._input_path:
            candidates = sorted(desktop_path().glob(f"{self._input_path.stem}_yutakaeng_review_*"), key=lambda item: item.stat().st_mtime, reverse=True)
            if candidates and any(candidates[0].glob("P*_F*_R*.png")):
                self._review_dir = candidates[0]
                self.copilot_button.setVisible(True)
                self.append_log("COPILOT_HELP_READY", "警告セル限定。ボタンから1件だけ選択して手動添付できます")
        self.phase_label.setText("解析完了。Excelをデスクトップへ出力しました。")
        self.append_log("EXPORT_COMPLETE", f"Excel出力完了: {result}")
        QMessageBox.information(self, "yutakaeng | 解析完了！", f"解析完了！\n\nExcelファイル:\n{result}\n\n警告がある行だけ確認・修正してください。")

    def open_copilot_help(self) -> None:
        if not self._review_dir:
            QMessageBox.information(self, "yutakaeng", "外部支援の対象となる警告セル画像がありません。")
            return
        image_path, _ = QFileDialog.getOpenFileName(self, "Copilotへ送る警告セル画像を1件だけ選択", str(self._review_dir), "Warning cell image (*.png)")
        if not image_path:
            return
        self.append_log("COPILOT_IMAGE_SELECTED", f"選択範囲のみ: {Path(image_path).name}")
        webbrowser.open(Path(image_path).as_uri())
        webbrowser.open("https://copilot.microsoft.com/")
        QMessageBox.information(self, "Copilotへ確認依頼", "先ほど開いた画像をCopilotへ手動で添付してください。\n\nPDF全体や別の行は添付せず、この1枚だけを送ってください。結果は候補として扱い、Excelへ入れる前に原図と照合してください。")

    def on_failure(self, message: str) -> None:
        self.timer.stop(); self.status.setText("ERROR  処理停止")
        self.append_log("PIPELINE_ERROR", message)
        QMessageBox.critical(self, "yutakaeng", f"解析を停止しました。\n\n{message}")

    def cleanup_thread(self) -> None:
        self.choose_button.setDisabled(False); self.drop_zone.setDisabled(False)
        self.choose_button.setVisible(True); self.drop_zone.setVisible(True)
        if self._thread:
            self._thread.deleteLater()
        self._thread = None; self._worker = None


def main() -> None:
    app = QApplication(sys.argv)
    app.setApplicationName("yutakaeng")
    window = MainWindow(); window.show()
    raise SystemExit(app.exec())


if __name__ == "__main__":
    main()
