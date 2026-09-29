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
    require("actions/download-artifact@" in assets, "asset assembly must download child workflow artifacts")
    require("gh release create" in assets and "--latest" in assets, "asset assembly must create one public Latest Release")
    require("--draft" not in assets, "asset assembly must never create a draft Release")

    android = read("release-android.yaml")
    ios = read("release-ios.yaml")
    require("workflow_call:" in android, "Android release must be reusable")
    require("workflow_call:" in ios, "iOS release must be reusable")
    require("CHANGES_NOT_SENT_FOR_REVIEW: ${{ vars.ANDROID_CHANGES_NOT_SENT_FOR_REVIEW }}" in android,
            "Play review staging must remain explicit")
    require("VITE_PLAY_BUILD: 'true'" in android, "Play web bundle must compile out unqualified AI surfaces")
    require("ANDROID_POLICY_HOLD: ${{ vars.ANDROID_POLICY_HOLD }}" in android,
            "Play submission must receive the production policy hold")
    require("python3 scripts/play_release.py check" in android and "python3 scripts/play_release.py publish" in android,
            "Every store release must use the shared lifecycle guard before building and submitting")
    require("android-play-store-release" in android and "cancel-in-progress: false" in android,
            "Testing and production must serialize without canceling in-flight submissions")
    require("needs.preflight.outputs.should-submit == 'true'" in android,
            "Blocked preflight must also block promotion of an already uploaded bundle")
    require("upload-google-play" not in android and "  promote:" not in android,
            "Testing and production must commit together, not submit successive reviews")
    require("/edits/{edit_id}/tracks/production" not in read("release-mobile-production.yaml"),
            "Parent workflow must not mistake rollout status for review status")
    testing_android = read("release-mobile-testing.yaml").split("  android:", 1)[1].split("  ios:", 1)[0]
    require("if: github.event_name == 'workflow_dispatch'" in testing_android,
            "Scheduled Android beta submissions must not starve the daily production review")
    desktop = read("release-desktop.yaml")
    require("ref: ${{ inputs.release_tag || github.sha }}" in android, "Android assets must checkout their release tag")
    require("ref: ${{ inputs.release_tag || github.sha }}" in desktop, "desktop assets must checkout their release tag")
    require("github.event_name != 'workflow_call'" not in android, "Android mode must not depend on the caller event name")
    require("github.event_name == 'workflow_call'" not in desktop, "desktop attachment must use the explicit release tag")
    require("softprops/action-gh-release" not in desktop, "desktop workflow must not create or mutate Releases")
    require("softprops/action-gh-release" not in android, "Android workflow must not create or mutate Releases")
    require("nexior-release-desktop-" in desktop, "desktop workflow must return versioned artifacts")
    require("nexior-release-android-" in android, "Android workflow must return a versioned artifact")
    require("formal macOS Releases require Developer ID signing and notarization credentials" in desktop, "formal Mac Releases must fail closed without signing credentials")
    require("os: macos-15-intel" in desktop, "desktop workflow must use the supported Intel macOS runner")
    require("os: macos-13" not in desktop, "desktop workflow still uses the retired macOS 13 runner")
    require("Publish to COS" not in desktop, "desktop workflow must publish through GitHub only")
    require("desktop-release" not in desktop, "desktop workflow still uses the retired COS approval environment")
    require("publish_desktop_release" not in desktop, "desktop workflow still invokes the retired COS uploader")
    require("dry_run" not in desktop and "inputs.channel" not in desktop, "desktop workflow still exposes feed inputs")
    require("if: needs.preflight.outputs.play-enabled == 'true'" in android,
            "Play artifacts must require the resolved store release mode")

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
        if (
            not path.is_file()
            or path.suffix not in searchable
            or path.name.startswith("CHANGELOG")
            or path == Path(__file__).resolve()
        ):
            continue
        text = path.read_text(errors="replace")
        for old in OLD:
            if old in text:
                stale.append(f"{path.relative_to(ROOT)}: {old}")
    require(not stale, "legacy workflow references remain:\n" + "\n".join(stale))

    print("Release workflow contract: OK")


if __name__ == "__main__":
    main()
