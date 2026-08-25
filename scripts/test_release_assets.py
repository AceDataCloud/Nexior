#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "deploy/release_assets.py"


class ReleaseAssetsTest(unittest.TestCase):
    def run_helper(self, *args: object) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["python3", str(HELPER), *(str(arg) for arg in args)],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_manifest_and_validate_happy_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "assets"
            root.mkdir()
            (root / "a.js").write_text("a")
            (root / "nested").mkdir()
            (root / "nested/b.css").write_text("bb")
            manifest = Path(temp) / "manifest"
            self.assertEqual(self.run_helper("manifest", root, manifest).returncode, 0)
            result = self.run_helper("validate", root, manifest, 2, 3)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("release_files=2", result.stdout)

    def test_rejects_unsafe_and_noncanonical_manifests(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            manifest = Path(temp) / "manifest"
            for text in ("../secret\n", "-T\n", "b.js\na.js\n", "a.js\na.js\n"):
                manifest.write_text(text)
                result = self.run_helper("check-list", manifest, 10)
                self.assertNotEqual(result.returncode, 0, text)

    def test_rejects_symlinks_and_size_overflow(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "assets"
            root.mkdir()
            target = root / "target.js"
            target.write_text("large")
            (root / "link.js").symlink_to(target)
            manifest = Path(temp) / "manifest"
            manifest.write_text("link.js\ntarget.js\n")
            self.assertNotEqual(self.run_helper("validate", root, manifest, 2, 100).returncode, 0)
            (root / "link.js").unlink()
            manifest.write_text("target.js\n")
            self.assertNotEqual(self.run_helper("validate", root, manifest, 1, 4).returncode, 0)

    def test_merge_rejects_conflicts_and_accepts_identical_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "source"
            destination = Path(temp) / "destination"
            source.mkdir()
            destination.mkdir()
            (source / "same.js").write_text("new")
            (destination / "same.js").write_text("old")
            manifest = Path(temp) / "manifest"
            manifest.write_text("same.js\n")
            conflict = self.run_helper("merge", source, manifest, destination, 1, 100)
            self.assertNotEqual(conflict.returncode, 0)
            (destination / "same.js").write_text("new")
            identical = self.run_helper("merge", source, manifest, destination, 1, 100)
            self.assertEqual(identical.returncode, 0, identical.stderr)


if __name__ == "__main__":
    unittest.main()
