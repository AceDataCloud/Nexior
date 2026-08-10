from pathlib import Path

import pytest

from publish_desktop_release import require_update_set


def paths(*names: str) -> list[Path]:
    return [Path(name) for name in names]


def complete_set() -> tuple[list[Path], list[Path]]:
    return (
        paths(
            "AceData-1.2.3.exe",
            "AceData-1.2.3.exe.blockmap",
            "AceData-1.2.3.dmg",
            "AceData-1.2.3-arm64.dmg",
            "AceData-1.2.3.zip",
            "AceData-1.2.3-arm64.zip",
            "AceData-1.2.3.zip.blockmap",
            "AceData-1.2.3-arm64.zip.blockmap",
        ),
        paths("latest.yml", "latest-mac.yml"),
    )


def test_accepts_complete_cross_platform_update_set() -> None:
    require_update_set(*complete_set())


@pytest.mark.parametrize(
    ("missing", "message"),
    [
        ("latest.yml", "Windows manifest"),
        ("latest-mac.yml", "macOS manifest"),
        ("AceData-1.2.3.exe", "NSIS installer"),
        ("AceData-1.2.3.exe.blockmap", "installer blockmap"),
        ("AceData-1.2.3-arm64.dmg", "arm64 DMG"),
        ("AceData-1.2.3.zip", "x64 update ZIP"),
        ("AceData-1.2.3-arm64.zip", "arm64 update ZIP"),
    ],
)
def test_rejects_incomplete_update_set(missing: str, message: str) -> None:
    artifacts, manifests = complete_set()
    remaining = [path for path in artifacts + manifests if path.name != missing]
    artifact_set = [path for path in remaining if path.suffix not in {".yml", ".yaml"}]
    manifest_set = [path for path in remaining if path.suffix in {".yml", ".yaml"}]
    with pytest.raises(ValueError, match=message):
        require_update_set(artifact_set, manifest_set)
