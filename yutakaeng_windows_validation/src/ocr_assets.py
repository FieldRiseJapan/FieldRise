"""Optional GitHub-derived OCR helpers for yutakaeng.

The adapter never uploads documents. PaddleOCR is optional so the existing
RapidOCR/Tesseract-only portable build remains usable if its model is absent.
"""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Iterable
import sys

import cv2
import numpy as np

_PADDLE_ENGINE = None
_PADDLE_INIT_ATTEMPTED = False


def _local_paddle_model_dir() -> Path:
    configured_text = __import__("os").environ.get("YUTAKAENG_PADDLE_MODELS", "").strip()
    if configured_text:
        return Path(configured_text)
    candidates = [
        Path(__file__).resolve().parents[1] / "paddle_models",
        Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent)) / "paddle_models",
        Path(sys.executable).resolve().parent / "paddle_models",
    ]
    for candidate in candidates:
        if (candidate / "PP-OCRv6_medium_det").is_dir() and (candidate / "PP-OCRv6_medium_rec").is_dir():
            return candidate
    return candidates[0]


def _load_paddle():
    global _PADDLE_ENGINE, _PADDLE_INIT_ATTEMPTED
    if _PADDLE_INIT_ATTEMPTED:
        return _PADDLE_ENGINE
    _PADDLE_INIT_ATTEMPTED = True
    model_root = _local_paddle_model_dir()
    det_dir = model_root / "PP-OCRv6_medium_det"
    rec_dir = model_root / "PP-OCRv6_medium_rec"
    # Critical privacy rule: never let PaddleOCR auto-download a model.
    if not det_dir.is_dir() or not rec_dir.is_dir():
        return None
    try:
        from paddleocr import PaddleOCR

        attempts = (
            {"lang": "en", "device": "cpu", "enable_mkldnn": False, "text_detection_model_dir": str(det_dir), "text_recognition_model_dir": str(rec_dir), "use_doc_orientation_classify": False, "use_doc_unwarping": False, "use_textline_orientation": False},
            {"lang": "en", "device": "cpu", "enable_mkldnn": False, "det_model_dir": str(det_dir), "rec_model_dir": str(rec_dir), "use_angle_cls": False},
        )
        for kwargs in attempts:
            try:
                _PADDLE_ENGINE = PaddleOCR(**kwargs)
                break
            except (TypeError, ValueError):
                continue
    except Exception:
        _PADDLE_ENGINE = None
    return _PADDLE_ENGINE


def paddle_available() -> bool:
    """Return whether the optional local PaddleOCR engine can be initialized."""
    return _load_paddle() is not None


def _flatten_paddle_result(result) -> Iterable[tuple[str, float]]:
    if result is None:
        return []
    items = result if isinstance(result, (list, tuple)) else [result]
    found: list[tuple[str, float]] = []
    for item in items:
        if isinstance(item, dict):
            texts = item.get("rec_texts") or item.get("texts") or []
            scores = item.get("rec_scores") or item.get("scores") or []
            found.extend((str(text), float(score)) for text, score in zip(texts, scores))
            continue
        rec_texts = getattr(item, "rec_texts", None)
        rec_scores = getattr(item, "rec_scores", None)
        if rec_texts is not None:
            found.extend((str(text), float(score)) for text, score in zip(rec_texts, rec_scores or []))
            continue
        # PaddleOCR 2.x returns [[box, (text, score)], ...].
        if isinstance(item, list):
            for entry in item:
                if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                    pair = entry[-1]
                    if isinstance(pair, (list, tuple)) and len(pair) >= 2:
                        found.append((str(pair[0]), float(pair[1])))
    return found


def paddle_candidates(image: np.ndarray) -> list[tuple[str, float, str]]:
    """Read one warning crop locally with PaddleOCR, if its model is installed."""
    engine = _load_paddle()
    if engine is None or image is None or image.size == 0:
        return []
    try:
        input_image = image
        if input_image.ndim == 2:
            input_image = cv2.cvtColor(input_image, cv2.COLOR_GRAY2BGR)
        result = engine.predict(input_image) if hasattr(engine, "predict") else engine.ocr(input_image, cls=False)
        return [(text.strip(), score, "paddle") for text, score in _flatten_paddle_result(result) if text.strip()]
    except Exception:
        return []


def ensemble_consensus(candidates: list[tuple[str, float, str]], min_engines: int = 2, min_score: float = 0.85) -> str:
    """Accept only a value independently returned by enough OCR engines.

    Multiple preprocessing variants from the same engine do not count as
    independent votes. This is the key safety rule borrowed from the
    ocr_ensemble approach: disagreement remains a warning, never a guess.
    """
    votes: dict[str, set[str]] = defaultdict(set)
    scores: dict[str, list[float]] = defaultdict(list)
    for value, score, engine in candidates:
        normalized = "".join(str(value).upper().split())
        if not normalized or float(score) < min_score:
            continue
        votes[normalized].add(str(engine))
        scores[normalized].append(float(score))
    eligible = [value for value, engines in votes.items() if len(engines) >= min_engines]
    if len(eligible) != 1:
        return ""
    return eligible[0]


def detect_cell_boundaries(gray: np.ndarray) -> list[int]:
    """Find strong horizontal rule rows for table-like wiring cells.

    This is intentionally a small OpenCV primitive inspired by img2table and
    engineering-drawing-extractor. It returns pixel rows only; callers decide
    which adjacent bands belong to ZT/T cells.
    """
    image = np.asarray(gray, dtype=np.uint8)
    if image.ndim != 2 or image.size == 0:
        return []
    binary = cv2.threshold(image, 200, 255, cv2.THRESH_BINARY_INV)[1]
    kernel_width = max(2, int(image.shape[1] * 0.55))
    horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_width, 1)))
    projection = (horizontal > 0).sum(axis=1)
    threshold = max(1, int(image.shape[1] * 0.45))
    points = [index for index, value in enumerate(projection) if value >= threshold]
    groups: list[list[int]] = []
    for point in points:
        if not groups or point > groups[-1][-1] + 1:
            groups.append([point])
        else:
            groups[-1].append(point)
    return [int(sum(group) / len(group)) for group in groups]


def split_by_boundaries(image: np.ndarray, boundaries: list[int]) -> list[np.ndarray]:
    """Return non-empty bands between detected boundaries."""
    if image is None or image.size == 0:
        return []
    points = [0] + sorted({p for p in boundaries if 0 < p < image.shape[0]}) + [image.shape[0]]
    return [image[a:b] for a, b in zip(points, points[1:]) if b - a >= 3]


def prepare_block_cell(image: np.ndarray) -> np.ndarray:
    """Remove detected horizontal cell rules while preserving character strokes."""
    if image is None or image.size == 0:
        return image
    result = np.asarray(image, dtype=np.uint8).copy()
    boundaries = detect_cell_boundaries(result)
    for row in boundaries:
        start = max(0, row - 1)
        stop = min(result.shape[0], row + 2)
        result[start:stop, :] = 255
    return result
