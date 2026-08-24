#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
from pathlib import Path, PurePosixPath
import re
import shlex
import shutil
import subprocess

TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")


def safe_path(value: str) -> PurePosixPath:
    path = PurePosixPath(value)
    if (
        not value
        or path.is_absolute()
        or value.startswith(("./", "-"))
        or ".." in path.parts
        or "\\" in value
        or any(ord(char) < 32 for char in value)
    ):
        raise ValueError(f"unsafe release asset path: {value!r}")
    return path


def load_manifest(path: Path, max_files: int) -> list[str]:
    items = path.read_text().splitlines()
    if not items or len(items) > max_files:
        raise ValueError(f"release has {len(items)} files (limit {max_files})")
    if items != sorted(set(items)):
        raise ValueError("release manifest must be sorted and unique")
    for item in items:
        safe_path(item)
    return items


def kubectl(*args: str, text: bool = False) -> subprocess.CompletedProcess:
    return subprocess.run(["kubectl", *args], check=True, capture_output=True, text=text)


def command_fetch(args: argparse.Namespace) -> None:
    if not TOKEN_PATTERN.fullmatch(args.token):
        raise ValueError("unsafe transfer token")
    remote = f"/tmp/acedata-assets-{args.token}"
    directory = shlex.quote(args.directory)
    tar_args = "-T /opt/acedata/release-assets" if args.manifest else "."
    setup = (
        f"set -eu; rm -rf {remote}; mkdir -p {remote}; "
        f"cd {directory}; tar -cf - {tar_args} | gzip -c > {remote}/archive.tgz; "
        f"split -b 262144 -a 4 {remote}/archive.tgz {remote}/part-; "
        f"sha256sum {remote}/archive.tgz | cut -d' ' -f1 > {remote}/sha256; "
        f"find {remote} -name 'part-*' -type f | sort > {remote}/parts"
    )
    kubectl("exec", "-n", args.namespace, args.pod, "--", "sh", "-lc", setup)
    try:
        parts_output = kubectl("exec", "-n", args.namespace, args.pod, "--", "cat", f"{remote}/parts", text=True).stdout
        parts = [part for part in parts_output.splitlines() if part]
        if not parts or any(not part.startswith(f"{remote}/part-") for part in parts):
            raise ValueError(f"invalid archive parts: {parts!r}")
        expected = kubectl("exec", "-n", args.namespace, args.pod, "--", "cat", f"{remote}/sha256", text=True).stdout.strip()
        compressed = bytearray()
        for part in parts:
            encoded = kubectl("exec", "-n", args.namespace, args.pod, "--", "base64", part).stdout
            compressed.extend(base64.b64decode(encoded))
        actual = hashlib.sha256(compressed).hexdigest()
        if actual != expected:
            raise ValueError(f"archive checksum mismatch: expected {expected}, got {actual}")
        Path(args.output).write_bytes(gzip.decompress(compressed))
        print(f"archive_parts={len(parts)}")
        print(f"archive_sha256={actual}")
    finally:
        subprocess.run(["kubectl", "exec", "-n", args.namespace, args.pod, "--", "rm", "-rf", remote], check=False)


def command_manifest(args: argparse.Namespace) -> None:
    root = Path(args.root)
    items = sorted(path.relative_to(root).as_posix() for path in root.rglob("*") if path.is_file())
    Path(args.output).write_text("".join(f"{item}\n" for item in items))


def command_check_list(args: argparse.Namespace) -> None:
    load_manifest(Path(args.manifest), args.max_files)


def validate_tree(root: Path, manifest: Path, max_files: int, max_bytes: int) -> tuple[list[str], int]:
    items = load_manifest(manifest, max_files)
    size = 0
    actual = []
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ValueError(f"release asset may not be a symlink: {path.relative_to(root)}")
        if path.is_file():
            actual.append(path.relative_to(root).as_posix())
    actual.sort()
    if actual != items:
        missing = sorted(set(items) - set(actual))
        surplus = sorted(set(actual) - set(items))
        raise ValueError(f"asset tree differs from manifest; missing={missing[:3]} surplus={surplus[:3]}")
    for item in items:
        path = root / item
        if not path.is_file():
            raise ValueError(f"missing release asset: {item}")
        size += path.stat().st_size
    if size > max_bytes:
        raise ValueError(f"release has {size} bytes (limit {max_bytes})")
    return items, size


def command_validate(args: argparse.Namespace) -> None:
    items, size = validate_tree(Path(args.root), Path(args.manifest), args.max_files, args.max_bytes)
    digest = hashlib.sha256(Path(args.manifest).read_bytes()).hexdigest()
    print(f"release_files={len(items)}")
    print(f"release_bytes={size}")
    print(f"release_manifest_sha256={digest}")


def command_merge(args: argparse.Namespace) -> None:
    source = Path(args.source)
    destination = Path(args.destination)
    items, size = validate_tree(source, Path(args.manifest), args.max_files, args.max_bytes)
    destination.mkdir(parents=True, exist_ok=True)
    for item in items:
        src = source / item
        dst = destination / item
        if dst.exists():
            if not dst.is_file() or hashlib.sha256(dst.read_bytes()).digest() != hashlib.sha256(src.read_bytes()).digest():
                raise ValueError(f"conflicting immutable asset: {item}")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
    print(f"merged_release_files={len(items)}")
    print(f"merged_release_bytes={size}")


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    fetch = subparsers.add_parser("fetch")
    fetch.add_argument("pod")
    fetch.add_argument("directory")
    fetch.add_argument("output")
    fetch.add_argument("token")
    fetch.add_argument("--manifest", action="store_true")
    fetch.add_argument("--namespace", default="acedatacloud")
    fetch.set_defaults(func=command_fetch)
    manifest = subparsers.add_parser("manifest")
    manifest.add_argument("root")
    manifest.add_argument("output")
    manifest.set_defaults(func=command_manifest)
    check = subparsers.add_parser("check-list")
    check.add_argument("manifest")
    check.add_argument("max_files", type=int)
    check.set_defaults(func=command_check_list)
    validate = subparsers.add_parser("validate")
    validate.add_argument("root")
    validate.add_argument("manifest")
    validate.add_argument("max_files", type=int)
    validate.add_argument("max_bytes", type=int)
    validate.set_defaults(func=command_validate)
    merge = subparsers.add_parser("merge")
    merge.add_argument("source")
    merge.add_argument("manifest")
    merge.add_argument("destination")
    merge.add_argument("max_files", type=int)
    merge.add_argument("max_bytes", type=int)
    merge.set_defaults(func=command_merge)
    args = parser.parse_args()
    try:
        args.func(args)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
