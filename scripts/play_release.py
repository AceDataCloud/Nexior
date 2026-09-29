#!/usr/bin/env python3
"""Serialize Play submissions and use Google's release lifecycle, not rollout status.

API contract: https://developers.google.com/android-publisher/api-ref/rest/v3/
applications.tracks.releases/list
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from dataclasses import dataclass
import json
import math
import os
from pathlib import Path
import re
import time
from urllib.parse import quote

PREFIX = "RELEASE_LIFECYCLE_STATE_"
KNOWN_STATES = {PREFIX + s for s in (
    "DRAFT", "NOT_SENT_FOR_REVIEW", "IN_REVIEW", "APPROVED_NOT_PUBLISHED",
    "NOT_APPROVED", "PUBLISHED",
)}


@dataclass
class Decision:
    submit: bool
    build: bool
    reason: str


def release_codes(release: dict) -> set[int]:
    artifacts = release.get("activeArtifacts", [])
    if not isinstance(artifacts, list):
        raise ValueError("Invalid activeArtifacts response")
    codes = set()
    for artifact in artifacts:
        code = artifact.get("versionCode")
        if type(code) is not int or code <= 0:
            raise ValueError("Invalid artifact versionCode")
        codes.add(code)
    return codes


def review_blocker(releases: list[dict]) -> str | None:
    for release in releases:
        state = release.get("releaseLifecycleState")
        if state not in KNOWN_STATES:
            raise ValueError("Unknown or missing Play release lifecycle; submission blocked")
        if state == PREFIX + "IN_REVIEW":
            codes = sorted(release_codes(release))
            return f"{release['track']} release {codes} is IN_REVIEW; waiting"
    return None


def decide(releases: list[dict], uploaded: set[int], target: int,
           destination: str, policy_cleared: bool) -> Decision:
    if target <= 0:
        raise ValueError("Invalid target versionCode")
    blocker = review_blocker(releases)
    if blocker:
        return Decision(False, False, blocker)
    if destination == "production" and not policy_cleared:
        return Decision(False, False, "Production policy hold is not cleared")
    for release in releases:
        if release["track"] != destination:
            continue
        codes = release_codes(release)
        state = release["releaseLifecycleState"]
        if state in {PREFIX + "PUBLISHED", PREFIX + "APPROVED_NOT_PUBLISHED"}:
            if codes and target <= max(codes):
                return Decision(False, False, f"Version {target} is not newer than {destination} {max(codes)}")
        if state == PREFIX + "NOT_APPROVED" and target in codes:
            return Decision(False, False, f"Rejected version {target} needs a corrected new versionCode")
    return Decision(True, target not in uploaded, f"No review in progress; submit version {target} to {destination}")


class PlayClient:
    def __init__(self, session, package: str):
        self.session = session
        self.base = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{quote(package, safe='')}"

    def request(self, method: str, path: str, **kwargs):
        response = self.session.request(method, self.base + path, timeout=kwargs.pop("timeout", 60), **kwargs)
        if response.status_code >= 400:
            # Never include request headers or service-account details in CI output.
            raise RuntimeError(f"Google Play {method} {path.split('?')[0]} returned HTTP {response.status_code}")
        return response.json() if response.content else {}

    @contextmanager
    def edit(self):
        edit_id = self.request("POST", "/edits", json={})["id"]
        try:
            yield edit_id
        finally:
            # A successful commit consumes the edit, so a subsequent 404 is normal.
            try:
                self.request("DELETE", f"/edits/{edit_id}")
            except Exception:
                pass

    def releases(self, edit_id: str, target_track: str) -> list[dict]:
        response = self.request("GET", f"/edits/{edit_id}/tracks")
        tracks = response.get("tracks")
        if not isinstance(tracks, list) or not tracks:
            raise ValueError("No authoritative Play track list; submission blocked")
        names = {"production", target_track}
        for track in tracks:
            name = track.get("track")
            if not isinstance(name, str) or not name:
                raise ValueError("Invalid Play track response")
            names.add(name)
        releases = []
        for name in sorted(names):
            body = self.request("GET", f"/tracks/{quote(name, safe='')}/releases")
            rows = body.get("releases", [])
            if not isinstance(rows, list):
                raise ValueError("Invalid Play release summaries")
            for row in rows:
                if not isinstance(row, dict) or row.get("track") != name:
                    raise ValueError("Invalid Play release track")
                releases.append(row)
        review_blocker(releases)  # Validate lifecycle fields before making decisions.
        return releases

    def uploaded_codes(self, edit_id: str) -> set[int]:
        codes = set()
        for kind in ("bundles", "apks"):
            body = self.request("GET", f"/edits/{edit_id}/{kind}")
            for artifact in body.get(kind, []):
                code = int(artifact["versionCode"])
                if code <= 0:
                    raise ValueError("Invalid uploaded versionCode")
                codes.add(code)
        return codes

    def upload(self, edit_id: str, artifact: Path) -> int:
        url = self.base.replace("/androidpublisher/v3/", "/upload/androidpublisher/v3/")
        with artifact.open("rb") as data:
            response = self.session.post(
                f"{url}/edits/{edit_id}/bundles", params={"uploadType": "media"},
                headers={"Content-Type": "application/octet-stream"}, data=data, timeout=600,
            )
        if response.status_code >= 400:
            raise RuntimeError(f"Play bundle upload returned HTTP {response.status_code}")
        return int(response.json()["versionCode"])


def run(client: PlayClient, *, target: int, version: str, track: str, promote: bool,
        rollout: float, policy_cleared: bool, publish: bool = False,
        artifact: Path | None = None, stage: bool = False) -> dict:
    if not math.isfinite(rollout) or not 0 < rollout <= 1:
        raise ValueError("Rollout must be > 0 and <= 1")
    destination = "production" if promote else track
    with client.edit() as edit_id:
        releases = client.releases(edit_id, track)
        uploaded = client.uploaded_codes(edit_id)
        decision = decide(releases, uploaded, target, destination, policy_cleared)
        result = {"should-submit": decision.submit, "should-build": decision.build,
                  "submitted": False, "reason": decision.reason}
        if not publish or not decision.submit:
            return result
        if decision.build:
            if artifact is None or client.upload(edit_id, artifact) != target:
                raise ValueError("AAB versionCode does not match the requested release")
        release = {"name": version, "versionCodes": [str(target)], "status": "completed"}
        destinations = list(dict.fromkeys([track, destination]))
        for name in destinations:
            desired = dict(release)
            if name == "production" and rollout < 1:
                desired.update(status="inProgress", userFraction=rollout)
            client.request("PUT", f"/edits/{edit_id}/tracks/{quote(name, safe='')}",
                           json={"track": name, "releases": [desired]})
        # Catch a Console/manual submission that appeared while the bundle uploaded.
        blocker = review_blocker(client.releases(edit_id, track))
        if blocker:
            return dict(result, **{"submitted": False, "reason": blocker})
        # Testing and production enter ONE review, rather than two successive commits.
        params = {"changesNotSentForReview": "true"} if stage else {}
        client.request("POST", f"/edits/{edit_id}:commit", params=params)
        return dict(result, **{"submitted": not stage,
                              "reason": f"Version {target} {'staged' if stage else 'sent for review'} on {', '.join(destinations)}; rollout={rollout}"})


def authenticated_client() -> PlayClient:
    import jwt
    import requests
    sa = json.loads(os.environ["SA_JSON"])
    now = int(time.time())
    assertion = jwt.encode({"iss": sa["client_email"],
                            "scope": "https://www.googleapis.com/auth/androidpublisher",
                            "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600},
                           sa["private_key"], algorithm="RS256")
    response = requests.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion,
    }, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"Google authentication returned HTTP {response.status_code}")
    session = requests.Session()
    session.headers.update(Authorization=f"Bearer {response.json()['access_token']}")
    return PlayClient(session, os.environ.get("PACKAGE_NAME", "com.acedatacloud.nexior"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("check", "publish"))
    args = parser.parse_args()
    result = run(authenticated_client(), target=int(os.environ["VERSION_CODE"]),
                 version=os.environ["VERSION_NAME"], track=os.environ.get("PLAY_TRACK", "beta"),
                 promote=os.environ.get("PROMOTE") == "true", rollout=float(os.environ.get("ROLLOUT", "1.0")),
                 policy_cleared=os.environ.get("ANDROID_POLICY_HOLD") == "cleared",
                 publish=args.mode == "publish", artifact=Path(os.environ.get("AAB_PATH", "app-play-release.aab")),
                 stage=os.environ.get("CHANGES_NOT_SENT_FOR_REVIEW") == "true")
    # External release names never reach command substitution or workflow syntax.
    result["reason"] = re.sub(r"[\r\n%]", " ", result["reason"])[:500]
    print(json.dumps(result))
    if output := os.environ.get("GITHUB_OUTPUT"):
        with open(output, "a") as f:
            for key, value in result.items():
                f.write(f"{key}={str(value).lower() if isinstance(value, bool) else value}\n")
    if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(summary, "a") as f:
            f.write(f"### Google Play release\n\n{result['reason']}\n")


if __name__ == "__main__":
    main()
