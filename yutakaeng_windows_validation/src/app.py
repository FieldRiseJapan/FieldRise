from __future__ import annotations

import sys
import time
from pathlib import Path

from PySide6.QtCore import QMimeData, QObject, QThread, QTimer, Qt, Signal
from PySide6.QtGui import QColor, QDragEnterEvent, QDropEvent, QFont, QPalette
from PySide6.QtWidgets import (
    QApplication, QFileDialog, QFrame, QHBoxLayout, QLabel, QMainWindow,
    QMessageBox, QPlainTextEdit, QProgressBar, QPushButton, QVBoxLayout, QWidget,
)

from pipeline import run_pipeline


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

    def __init__(self, path: str) -> None:
        super().__init__()
        self.path = path

    def run(self) -> None:
        try:
            result = run_pipeline(self.path, self.log.emit, self.progress.emit)
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
        self._thread: QThread | None = None
        self._worker: Worker | None = None
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_timer)
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
        controls.addStretch(); controls.addWidget(self.choose_button); controls.addStretch()
        layout.addLayout(controls)

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

        log_title = QLabel("LIVE PROCESS LOG")
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
        QPushButton:disabled { background: #254157; color: #7991a0; }
        #progressBox { background: #0a1c2d; border: 1px solid #1d4059; border-radius: 10px; padding: 8px; }
        QProgressBar { background: #071421; border: 1px solid #24516e; border-radius: 6px; height: 16px; color: #e8f5ff; text-align: center; }
        QProgressBar::chunk { background: #1686d1; border-radius: 5px; }
        #counter, #eta_label { color: #86aabd; font-size: 12px; }
        #logTitle { color: #6cbefa; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
        #logView { background: #030a11; border: 1px solid #1d4059; border-radius: 8px; color: #9ae6ad; font-family: Consolas, 'Cascadia Mono', monospace; font-size: 12px; padding: 8px; }
        """)

    def append_log(self, code: str, message: str) -> None:
        stamp = time.strftime("%H:%M:%S")
        self.log_view.appendPlainText(f"[{stamp}] {code:<20} {message}")
        bar = self.log_view.verticalScrollBar(); bar.setValue(bar.maximum())

    def choose_pdf(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "配線図PDFを選択", str(Path.home()), "PDF files (*.pdf)")
        if path: self.start_analysis(path)

    def start_analysis(self, path: str) -> None:
        if self._thread and self._thread.isRunning():
            return
        self.choose_button.setDisabled(True); self.drop_zone.setDisabled(True)
        self.progress.setValue(0); self._done, self._total = 0, 1
        self._started_at = time.monotonic(); self.timer.start(1000)
        self.status.setText("RUNNING  PDF解析中")
        self.phase_label.setText(f"解析開始: {Path(path).name}")
        self.append_log("PDF_ACCEPTED", f"入力: {path}")
        self.append_log("PIPELINE_START", "OCR候補抽出・除外判定・電線サイズ別Excel出力を開始")
        self._thread = QThread(self); self._worker = Worker(path); self._worker.moveToThread(self._thread)
        self._thread.started.connect(self._worker.run)
        self._worker.log.connect(self.append_log); self._worker.progress.connect(self.on_progress)
        self._worker.completed.connect(self.on_complete); self._worker.failed.connect(self.on_failure)
        self._worker.completed.connect(self._thread.quit); self._worker.failed.connect(self._thread.quit)
        self._thread.finished.connect(self.cleanup_thread)
        self._thread.start()

    def on_progress(self, done: int, total: int) -> None:
        self._done, self._total = done, max(1, total)
        value = int(done / self._total * 100)
        self.progress.setValue(value); self.phase_label.setText(f"ページ解析 {done} / {total}")

    def update_timer(self) -> None:
        if not self._started_at: return
        elapsed = int(time.monotonic() - self._started_at)
        remain = "--:--"
        if self._done > 0 and self._total > self._done:
            seconds = int(elapsed / self._done * (self._total - self._done))
            remain = f"{seconds // 60:02}:{seconds % 60:02}"
        self.counter_label.setText(f"ページ {self._done} / {self._total}   |   経過 {elapsed // 60:02}:{elapsed % 60:02}")
        self.eta_label.setText(f"推定残り {remain}")

    def on_complete(self, result: str) -> None:
        self.timer.stop(); self.progress.setValue(100); self.status.setText("COMPLETE  Excel出力済み")
        self.phase_label.setText("解析完了。候補Excelをデスクトップへ出力しました。")
        self.append_log("EXPORT_COMPLETE", result)
        QMessageBox.information(self, "yutakaeng", f"検証用Excelを出力しました。\n\n{result}\n\n候補データのため、全行確認と警告解消後に最終確定してください。")

    def on_failure(self, message: str) -> None:
        self.timer.stop(); self.status.setText("ERROR  処理停止")
        self.append_log("PIPELINE_ERROR", message)
        QMessageBox.critical(self, "yutakaeng", f"解析を停止しました。\n\n{message}")

    def cleanup_thread(self) -> None:
        self.choose_button.setDisabled(False); self.drop_zone.setDisabled(False)
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
