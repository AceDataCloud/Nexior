#!/usr/bin/env python3
"""Validate the release workflow names and call graph."""

from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"

EXPECTED = {
    "check-pr.yaml",
    "deploy-web.yaml",
    "maintenance-translate-i18n.yaml",
    "release-android.yaml",
    "release-assets.yaml",
    "release-daily.yaml",
    "release-desktop.yaml",
    "release-ios.yaml",
    "release-mobile-manual.yaml",
    "release-mobile-production.yaml",
    "release-mobile-testing.yaml",
    "release-ota.yaml",
}
OLD = {
    "auto-production-mobile.yaml",
    "auto-release-mobile.yaml",
    "build-android.yaml",
    "build-ios.yaml",
    "ci.yaml",
    "deploy.yaml",
    "desktop.yml",
    "github-release.yaml",
    "publish-ota.yaml",
    "publish.yaml",
    "release-mobile.yaml",
    "translate.yaml",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read(name: str) -> str:
    return (WORKFLOWS / name).read_text()


def main() -> None:
    present = {path.name for path in WORKFLOWS.iterdir() if path.is_file()}
    require(EXPECTED <= present, f"missing workflows: {sorted(EXPECTED - present)}")
    require(not (OLD & present), f"legacy workflows remain: {sorted(OLD & present)}")

    daily = read("release-daily.yaml")
    require("uses: ./.github/workflows/release-assets.yaml" in daily, "daily release must await asset assembly")
    require("BEFORE=" not in daily and "AFTER=" not in daily, "daily release must not infer publishing from its working tree")
    require("git ls-remote --tags --refs" in daily, "daily release must reconcile remote tags")

    assets = read("release-assets.yaml")
    require("workflow_call:" in assets, "asset assembly must be reusable")
    for child in ("release-desktop.yaml", "release-android.yaml"):
        require(f"uses: ./.github/workflows/{child}" in assets, f"asset assembly must call {child}")

    android = read("release-android.yaml")
    ios = read("release-ios.yaml")
    require("workflow_call:" in android, "Android release must be reusable")
    require("workflow_call:" in ios, "iOS release must be reusable")
    require("changesNotSentForReview" not in android, "obsolete Google Play review parameter returned")
    desktop = read("release-desktop.yaml")
    require("ref: ${{ inputs.release_tag || github.sha }}" in android, "Android assets must checkout their release tag")
    require("ref: ${{ inputs.release_tag || github.sha }}" in desktop, "desktop assets must checkout their release tag")
    require("github.event_name != 'workflow_call'" not in android, "Android mode must not depend on the caller event name")
    require("github.event_name == 'workflow_call'" not in desktop, "desktop attachment must use the explicit release tag")
    require("if: inputs.release_tag != ''" in desktop, "desktop installers must attach when a release tag is supplied")
    require("if: inputs.upload_to_play || startsWith(github.ref, 'refs/tags/android-v')" in android, "Play steps must require an explicit store release mode")

    for parent in ("release-mobile-testing.yaml", "release-mobile-production.yaml", "release-mobile-manual.yaml"):
        text = read(parent)
        require("gh workflow run" not in text, f"{parent} must await reusable platform workflows")
        require("uses: ./.github/workflows/release-" in text, f"{parent} has no reusable workflow call")

    searchable = {".yaml", ".yml", ".md", ".py"}
    tracked = subprocess.check_output(["git", "-C", ROOT, "ls-files", "-z"]).decode().split("\0")
    stale: list[str] = []
    for relative in tracked:
        if not relative:
            continue
        path = ROOT / relative
        if path.suffix not in searchable or path.name.startswith("CHANGELOG") or path == Path(__file__).resolve():
            continue
        text = path.read_text(errors="replace")
        for old in OLD:
            if old in text:
                stale.append(f"{path.relative_to(ROOT)}: {old}")
    require(not stale, "legacy workflow references remain:\n" + "\n".join(stale))

    print("Release workflow contract: OK")


if __name__ == "__main__":
    main()
