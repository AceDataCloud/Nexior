#!/usr/bin/env python3
"""
Publish an Electron desktop release for Nexior to Tencent Cloud COS.

Uploads every file in the electron-builder output dir (default `release/`) to
`<prefix>/` on COS, which is served at `https://cdn.acedata.cloud/nexior/desktop`
— the `publish.url` electron-updater reads. The update manifests
(`latest.yml` / `latest-mac.yml` / `beta.yml` / ...) are uploaded LAST and with a
short cache TTL, so the feed never points at an artifact that isn't up yet and a
rollback (re-uploading an older manifest) is visible within seconds.

Designed to run from the `desktop` GitHub Actions workflow. Reads COS
credentials from env vars `TENCENT_CLOUD_SECRET_ID` / `TENCENT_CLOUD_SECRET_KEY`.
"""

from __future__ import annotations

import argparse
import mimetypes
import os
import sys
from pathlib import Path
from typing import Iterable

DEFAULT_REGION = "ap-beijing"
DEFAULT_BUCKET = "acedatacloud2-1256437459"
DEFAULT_PREFIX = "nexior/desktop"
DEFAULT_CDN_BASE = "https://cdn.acedata.cloud/nexior/desktop"

# Only these extensions are published. electron-builder also emits unpacked
# dirs, blockmaps, and builder-debug.yml — we ship installers + manifests +
# blockmaps (needed for differential updates) and skip the rest.
ARTIFACT_EXTS = {".exe", ".dmg", ".zip", ".blockmap", ".AppImage"}
MANIFEST_EXTS = {".yml", ".yaml"}


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
    # Global Accelerate endpoint — uploads from GH Actions runners (US/EU) to
    # ap-beijing time out without this. The bucket has Accelerate enabled.
    return CosS3Client(
        CosConfig(
            Region=region,
            SecretId=secret_id,
            SecretKey=secret_key,
            Scheme="https",
            Endpoint="cos.accelerate.myqcloud.com",
        )
    )


def upload(client, bucket: str, key: str, path: Path, *, is_manifest: bool, dry_run: bool) -> None:
    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if is_manifest:
        content_type = "text/yaml"
    size = path.stat().st_size
    print(f"  → cos://{bucket}/{key}  ({size} bytes, {content_type})")
    if dry_run:
        return
    with path.open("rb") as body:
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=body,
            ContentType=content_type,
            # Manifests must not be edge-cached for long (rollbacks/new releases
            # within seconds). Installers carry the version in their filename, so
            # they're effectively immutable and can be cached aggressively.
            CacheControl="public, max-age=60"
            if is_manifest
            else "public, max-age=31536000, immutable",
        )


def main(argv: Iterable[str]) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dist", default="release", type=Path, help="electron-builder output dir. Default: release.")
    p.add_argument("--bucket", default=DEFAULT_BUCKET, help=f"COS bucket. Default: {DEFAULT_BUCKET}.")
    p.add_argument("--region", default=DEFAULT_REGION, help=f"COS region. Default: {DEFAULT_REGION}.")
    p.add_argument("--prefix", default=DEFAULT_PREFIX, help=f"Object-key prefix. Default: {DEFAULT_PREFIX}.")
    p.add_argument("--cdn-base", default=DEFAULT_CDN_BASE, help=f"Public CDN base. Default: {DEFAULT_CDN_BASE}.")
    p.add_argument("--dry-run", action="store_true", help="Print upload targets without uploading.")
    args = p.parse_args(list(argv))

    if not args.dist.is_dir():
        print(f"ERROR: dist dir not found: {args.dist}", file=sys.stderr)
        return 2

    files = [f for f in sorted(args.dist.iterdir()) if f.is_file()]
    artifacts = [f for f in files if f.suffix in ARTIFACT_EXTS]
    manifests = [f for f in files if f.suffix in MANIFEST_EXTS and not f.name.startswith("builder-")]

    if not artifacts:
        print(f"ERROR: no installer artifacts ({sorted(ARTIFACT_EXTS)}) in {args.dist}", file=sys.stderr)
        return 2
    if not manifests:
        print(f"ERROR: no update manifest (latest*.yml) in {args.dist}", file=sys.stderr)
        return 2

    print(f"Publishing {len(artifacts)} artifact(s) + {len(manifests)} manifest(s) to {args.cdn_base}")
    client = None if args.dry_run else get_client(args.region)

    # Artifacts FIRST, manifests LAST — the feed must never reference a file
    # that isn't up yet.
    for f in artifacts:
        upload(client, args.bucket, f"{args.prefix}/{f.name}", f, is_manifest=False, dry_run=args.dry_run)
    for f in manifests:
        upload(client, args.bucket, f"{args.prefix}/{f.name}", f, is_manifest=True, dry_run=args.dry_run)

    print("DRY RUN — nothing uploaded." if args.dry_run else f"OK. Feed live at {args.cdn_base}/<channel>.yml")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
