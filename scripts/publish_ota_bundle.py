#!/usr/bin/env python3
"""
Publish an OTA bundle for Nexior to Tencent Cloud COS.

Uploads:
  1. The zipped `dist/` bundle to `<prefix>/<channel>/bundles/<version>.zip`.
  2. A platform-specific manifest JSON to `<prefix>/<channel>/<platform>.json`
     for every platform passed in `--platforms` (default: ios + android).

Both iOS WKWebView and Android WebView serve the same `dist/` build, so a
single zip is reused across platforms — only the manifest filename differs.
Reviewers asked us to keep the per-platform manifest split anyway so we can
later diverge bundle policy (e.g. iOS lagging on a problematic build) without
changing the publish pipeline.

Designed to run from the `publish-ota` GitHub Actions workflow. Reads COS
credentials from env vars `TENCENT_CLOUD_SECRET_ID` / `TENCENT_CLOUD_SECRET_KEY`.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Iterable

DEFAULT_REGION = "ap-beijing"
DEFAULT_BUCKET = "acedatacloud2-1256437459"
DEFAULT_PREFIX = "nexior/updates"
DEFAULT_CDN_BASE = "https://cdn.acedata.cloud/nexior/updates"


def sha256_b64(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return base64.b64encode(h.digest()).decode("ascii")


def get_client(region: str):
    try:
        from qcloud_cos import CosConfig, CosS3Client
    except ImportError:
        print("ERROR: cos-python-sdk-v5 not installed (pip install cos-python-sdk-v5)", file=sys.stderr)
        sys.exit(2)
    secret_id = os.environ.get("TENCENT_CLOUD_SECRET_ID")
    secret_key = os.environ.get("TENCENT_CLOUD_SECRET_KEY")
    if not secret_id or not secret_key:
        print("ERROR: TENCENT_CLOUD_SECRET_ID / TENCENT_CLOUD_SECRET_KEY must be set", file=sys.stderr)
        sys.exit(2)
    return CosS3Client(CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Scheme="https"))


def upload(client, bucket: str, key: str, body: bytes, content_type: str, *, dry_run: bool) -> None:
    print(f"  → cos://{bucket}/{key}  ({len(body)} bytes, {content_type})")
    if dry_run:
        return
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=body,
        ContentType=content_type,
        # Manifests must not be edge-cached for long — we want rollbacks /
        # new releases visible within seconds. Bundles are immutable
        # (URL contains the version), so they default to whatever COS sets
        # and downstream CDN can cache them indefinitely.
        CacheControl="public, max-age=60" if content_type.startswith("application/json") else "public, max-age=31536000, immutable",
    )


def main(argv: Iterable[str]) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--zip", required=True, type=Path, help="Path to the zipped dist/ bundle.")
    p.add_argument("--version", required=True, help="Bundle version, e.g. 3.35.3")
    p.add_argument("--channel", default="stable", help="Release channel (stable, beta, ...). Default: stable.")
    p.add_argument("--platforms", default="ios,android", help="Comma-separated list of platform manifest names to write. Default: ios,android.")
    p.add_argument("--min-native-version", default="", help="Optional `min_native_version` written into the manifest. Bundles below this are skipped client-side.")
    p.add_argument("--bucket", default=DEFAULT_BUCKET, help=f"COS bucket. Default: {DEFAULT_BUCKET}.")
    p.add_argument("--region", default=DEFAULT_REGION, help=f"COS region. Default: {DEFAULT_REGION}.")
    p.add_argument("--prefix", default=DEFAULT_PREFIX, help=f"Object-key prefix inside the bucket. Default: {DEFAULT_PREFIX}.")
    p.add_argument("--cdn-base", default=DEFAULT_CDN_BASE, help=f"Public CDN base URL written into manifest.url. Default: {DEFAULT_CDN_BASE}.")
    p.add_argument("--dry-run", action="store_true", help="Print upload targets and the manifest JSON without uploading.")
    args = p.parse_args(list(argv))

    if not args.zip.is_file():
        print(f"ERROR: bundle zip not found: {args.zip}", file=sys.stderr)
        return 2

    checksum = sha256_b64(args.zip)
    zip_bytes = args.zip.read_bytes()
    bundle_key = f"{args.prefix}/{args.channel}/bundles/{args.version}.zip"
    bundle_url = f"{args.cdn_base}/{args.channel}/bundles/{args.version}.zip"

    manifest: dict = {
        "version": args.version,
        "url": bundle_url,
        "checksum": checksum,
    }
    if args.min_native_version:
        manifest["min_native_version"] = args.min_native_version
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")

    print(f"Bundle: {args.zip}  sha256(b64)={checksum}")
    print(f"Channel: {args.channel}")
    print(f"Manifest:\n{manifest_bytes.decode('utf-8')}")

    client = None if args.dry_run else get_client(args.region)
    upload(client, args.bucket, bundle_key, zip_bytes, "application/zip", dry_run=args.dry_run)
    for platform in [p.strip() for p in args.platforms.split(",") if p.strip()]:
        manifest_key = f"{args.prefix}/{args.channel}/{platform}.json"
        upload(client, args.bucket, manifest_key, manifest_bytes, "application/json", dry_run=args.dry_run)

    if args.dry_run:
        print("DRY RUN — nothing uploaded.")
    else:
        print(f"OK. Live at {args.cdn_base}/{args.channel}/<platform>.json")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
