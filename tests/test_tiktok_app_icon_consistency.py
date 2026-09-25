from __future__ import annotations

import hashlib
import posixpath
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_PATH = "assets/fieldrise-creator-studio-icon.jpg"
CANONICAL_FILE = ROOT / CANONICAL_PATH
EXPECTED_PORTAL_SHA256 = "ae4d0c8b1b9b00ca2be55bc017ac80b17026f94de984ae3e8081847776eb560e"
PAGES = (
    ROOT / "automation/sns_auto_posting/tiktok/index.html",
    ROOT / "terms.html",
    ROOT / "privacy.html",
)


class IconReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.favicons: list[str] = []
        self.app_icons: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag.lower() == "link" and "icon" in (attributes.get("rel") or "").lower().split():
            self.favicons.append(attributes.get("href") or "")
        if tag.lower() == "img" and set((attributes.get("class") or "").split()) & {"logo", "app-icon"}:
            self.app_icons.append(attributes.get("src") or "")


def repo_path_for_reference(page: Path, reference: str) -> str:
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment:
        return reference
    return posixpath.normpath(posixpath.join(page.parent.relative_to(ROOT).as_posix(), parsed.path))


class TikTokAppIconConsistencyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.parsers: dict[Path, IconReferenceParser] = {}
        for page in PAGES:
            parser = IconReferenceParser()
            parser.feed(page.read_text(encoding="utf-8"))
            self.parsers[page] = parser

    def test_each_page_uses_the_single_canonical_image_for_favicon_and_visible_icon(self) -> None:
        for page, parser in self.parsers.items():
            with self.subTest(page=page.relative_to(ROOT).as_posix()):
                self.assertTrue(parser.favicons, "page must declare a favicon")
                self.assertTrue(parser.app_icons, "page must render the app icon")
                for reference in parser.favicons + parser.app_icons:
                    self.assertEqual(
                        repo_path_for_reference(page, reference),
                        CANONICAL_PATH,
                        f"unexpected icon reference in {page.relative_to(ROOT)}: {reference[:100]}",
                    )

    def test_canonical_file_is_the_verified_tiktok_portal_image(self) -> None:
        self.assertTrue(CANONICAL_FILE.is_file(), "canonical image asset is missing")
        digest = hashlib.sha256(CANONICAL_FILE.read_bytes()).hexdigest()
        self.assertEqual(digest, EXPECTED_PORTAL_SHA256)
        with Image.open(CANONICAL_FILE) as image:
            self.assertEqual(image.format, "JPEG")
            self.assertEqual(image.size, (1024, 1024))


if __name__ == "__main__":
    unittest.main(verbosity=2)
