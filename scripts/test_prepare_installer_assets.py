import hashlib
import tempfile
import unittest
from pathlib import Path

from scripts.prepare_installer_assets import prepare


class InstallerAssetsTest(unittest.TestCase):
    version = "3.378.1"

    def fixtures(self, root, legacy=False):
        names = [
            f"nexior-{self.version}.apk",
            f"AceData Setup {self.version}.exe" if legacy else f"AceData.Setup.{self.version}.exe",
            f"AceData-{self.version}.dmg",
            f"AceData-{self.version}-arm64.dmg",
            f"nexior-dist-@acedatacloud-nexior_v{self.version}.tar.gz",
        ]
        for name in names:
            (root / name).write_bytes(name.encode())
        web = names[-1]
        digest = hashlib.sha256(web.encode()).hexdigest()
        (root / f"{web}.sha256").write_text(f"{digest}  {web}\n")

    def test_complete_release_and_legacy_windows_name(self):
        for legacy in (False, True):
            with self.subTest(legacy=legacy), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                self.fixtures(root, legacy)
                prepare(root, self.version)
                self.assertEqual((root / "nexior.apk").read_bytes(), (root / f"nexior-{self.version}.apk").read_bytes())
                self.assertEqual((root / "AceData.Setup.exe").read_bytes(), (root / f"AceData.Setup.{self.version}.exe").read_bytes())
                for line in (root / "SHA256SUMS").read_text().splitlines():
                    digest, name = line.split("  ")
                    self.assertEqual(digest, hashlib.sha256((root / name).read_bytes()).hexdigest())
                self.assertEqual(len(list(root.iterdir())), 11)

    def test_incomplete_or_corrupt_release_never_gets_aliases(self):
        for problem in ("missing", "empty", "checksum", "unexpected"):
            with self.subTest(problem=problem), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                self.fixtures(root)
                apk = root / f"nexior-{self.version}.apk"
                if problem == "missing":
                    apk.unlink()
                elif problem == "empty":
                    apk.write_bytes(b"")
                elif problem == "checksum":
                    next(root.glob("*.tar.gz")).write_bytes(b"corrupt")
                else:
                    (root / "other.exe").write_bytes(b"unexpected")
                with self.assertRaises(ValueError):
                    prepare(root, self.version)
                self.assertFalse((root / "nexior.apk").exists())
