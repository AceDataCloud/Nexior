#!/usr/bin/env python3
"""Validate a complete release and add stable names for /latest/download links."""

import hashlib
import re
import shutil
import sys
from pathlib import Path


def prepare(directory: Path, version: str) -> None:
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError(f"Invalid release version: {version}")
    installers = {
        f"nexior-{version}.apk": "nexior.apk",
        f"AceData.Setup.{version}.exe": "AceData.Setup.exe",
        f"AceData-{version}.dmg": "AceData.dmg",
        f"AceData-{version}-arm64.dmg": "AceData-arm64.dmg",
    }
    # Older tags used electron-builder's space-separated Windows filename.
    legacy = directory / f"AceData Setup {version}.exe"
    canonical = directory / f"AceData.Setup.{version}.exe"
    if legacy.is_file() and not canonical.exists():
        legacy.rename(canonical)

    web = f"nexior-dist-@acedatacloud-nexior_v{version}.tar.gz"
    expected = set(installers) | {web, f"{web}.sha256"}
    actual = {path.name for path in directory.iterdir()}
    if actual != expected:
        raise ValueError(f"Incomplete release: missing={sorted(expected - actual)}, unexpected={sorted(actual - expected)}")
    for name in expected:
        path = directory / name
        if path.is_symlink() or not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f"Invalid release file: {name}")
    with (directory / web).open("rb") as stream:
        web_digest = hashlib.file_digest(stream, "sha256").hexdigest()
    if (directory / f"{web}.sha256").read_text().split() != [web_digest, web]:
        raise ValueError("Web archive checksum mismatch")

    for source, alias in installers.items():
        shutil.copyfile(directory / source, directory / alias)
    lines = []
    for name in sorted(expected | set(installers.values())):
        with (directory / name).open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        lines.append(f"{digest}  {name}\n")
    (directory / "SHA256SUMS").write_text("".join(lines))


if __name__ == "__main__":
    prepare(Path(sys.argv[1]), sys.argv[2])
