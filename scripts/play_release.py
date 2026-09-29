#!/usr/bin/env python3
"""Check Play review state; commit testing and production together when clear."""
import json
import os
from pathlib import Path
import sys
import time
from urllib.parse import quote

import jwt
import requests


def main():
    mode = sys.argv[1]
    if mode not in {"check", "publish"}:
        raise ValueError("Expected check or publish")
    target = int(os.environ["VERSION_CODE"])
    track = os.environ.get("PLAY_TRACK", "beta")
    destination = "production" if os.environ.get("PROMOTE") == "true" else track
    rollout = float(os.environ.get("ROLLOUT", "1.0"))
    if not 0 < rollout <= 1:
        raise ValueError("Rollout must be > 0 and <= 1")
    result = {"should-submit": False, "should-build": False, "submitted": False, "reason": ""}
    sa = json.loads(os.environ["SA_JSON"])
    now = int(time.time())
    assertion = jwt.encode({"iss": sa["client_email"], "iat": now, "exp": now + 3600,
                            "scope": "https://www.googleapis.com/auth/androidpublisher",
                            "aud": "https://oauth2.googleapis.com/token"}, sa["private_key"], algorithm="RS256")
    token = requests.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion,
    }, timeout=30)
    token.raise_for_status()
    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {token.json()['access_token']}"
    base = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{os.environ['PACKAGE_NAME']}"

    def api(method, path, **kwargs):
        response = session.request(method, base + path, timeout=60, **kwargs)
        response.raise_for_status()
        return response.json() if response.content else {}

    edit = api("POST", "/edits", json={})["id"]

    def releases():
        tracks = api("GET", f"/edits/{edit}/tracks")["tracks"]
        names = {t["track"] for t in tracks} | {track, "production"}
        rows = []
        for name in sorted(names):
            # Rollout status (completed/inProgress) does not indicate review status.
            rows.extend(api("GET", f"/tracks/{quote(name, safe='')}/releases").get("releases", []))
        for release in rows:
            state = release["releaseLifecycleState"].removeprefix("RELEASE_LIFECYCLE_STATE_")
            if state not in {"DRAFT", "NOT_SENT_FOR_REVIEW", "IN_REVIEW", "APPROVED_NOT_PUBLISHED", "NOT_APPROVED", "PUBLISHED"}:
                raise ValueError("Play review state is unknown")
            if state == "IN_REVIEW":
                result.update({"should-submit": False, "reason": f"{release['track']} is IN_REVIEW; waiting"})
                return None
        return rows

    try:
        rows = releases()
        if rows is None:
            return
        if destination == "production" and os.environ.get("ANDROID_POLICY_HOLD") != "cleared":
            result["reason"] = "Production policy hold is not cleared"
            return
        for release in rows:
            codes = [a["versionCode"] for a in release.get("activeArtifacts", [])]
            state = release["releaseLifecycleState"].removeprefix("RELEASE_LIFECYCLE_STATE_")
            if release["track"] == destination and codes:
                if (state in {"PUBLISHED", "APPROVED_NOT_PUBLISHED"} and target <= max(codes)) or (
                    state == "NOT_APPROVED" and target in codes
                ):
                    result["reason"] = f"No new version to submit to {destination}"
                    return
        uploaded = set()
        for kind in ("bundles", "apks"):
            uploaded.update(int(a["versionCode"]) for a in api("GET", f"/edits/{edit}/{kind}").get(kind, []))
        result.update({"should-submit": True, "should-build": target not in uploaded,
                       "reason": f"No review in progress; submit {target} to {destination}"})
        if mode == "check":
            return
        if target not in uploaded:
            upload_base = base.replace("/androidpublisher/v3/", "/upload/androidpublisher/v3/")
            with Path(os.environ["AAB_PATH"]).open("rb") as data:
                response = session.post(f"{upload_base}/edits/{edit}/bundles", params={"uploadType": "media"},
                                        headers={"Content-Type": "application/octet-stream"}, data=data, timeout=600)
            response.raise_for_status()
            if int(response.json()["versionCode"]) != target:
                raise ValueError("AAB versionCode does not match the requested release")
        for name in dict.fromkeys([track, destination]):
            release = {"name": os.environ["VERSION_NAME"], "versionCodes": [str(target)], "status": "completed"}
            if name == "production" and rollout < 1:
                release.update(status="inProgress", userFraction=rollout)
            api("PUT", f"/edits/{edit}/tracks/{quote(name, safe='')}", json={"track": name, "releases": [release]})
        if releases() is None:  # Another submission may have started during upload.
            return
        stage = os.environ.get("CHANGES_NOT_SENT_FOR_REVIEW") == "true"
        api("POST", f"/edits/{edit}:commit", params={"changesNotSentForReview": "true"} if stage else {})
        result.update(submitted=not stage, reason=f"Version {target} {'staged' if stage else 'sent for review'}; rollout={rollout}")
    finally:
        try:
            session.delete(f"{base}/edits/{edit}", timeout=30)  # Committed edits return 404.
        except requests.RequestException:
            pass  # Cleanup failure must not turn an accepted submission into a retry.
        result["reason"] = " ".join(result["reason"].split())
        print(json.dumps(result))
        if output := os.environ.get("GITHUB_OUTPUT"):
            with open(output, "a") as f:
                for key, value in result.items():
                    f.write(f"{key}={str(value).lower() if isinstance(value, bool) else value}\n")
        if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(summary, "a") as f:
                f.write(f"### Google Play\n\n{result['reason']}\n")


if __name__ == "__main__":
    main()
