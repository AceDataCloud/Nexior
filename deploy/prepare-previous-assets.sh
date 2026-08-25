#!/usr/bin/env bash
set -euo pipefail

: "${PREVIOUS_IMAGE:?PREVIOUS_IMAGE is required}"
: "${MAX_RELEASE_FILES:?MAX_RELEASE_FILES is required}"
: "${MAX_RELEASE_BYTES:?MAX_RELEASE_BYTES is required}"

output_dir=${OUTPUT_DIR:-.previous-assets}
manifest_file=${MANIFEST_FILE:-.previous-release-assets}
tmp_dir=$(mktemp -d)
cleanup() { rm -rf "$tmp_dir"; }
trap cleanup EXIT

rm -rf "$output_dir"
mkdir -p "$output_dir"
docker pull "$PREVIOUS_IMAGE"
if docker run --rm --entrypoint test "$PREVIOUS_IMAGE" -f /opt/acedata/release-assets; then
  docker run --rm --entrypoint cat "$PREVIOUS_IMAGE" /opt/acedata/release-assets > "$manifest_file"
  python3 deploy/release_assets.py check-list "$manifest_file" "$MAX_RELEASE_FILES"
  docker run --rm --entrypoint sh "$PREVIOUS_IMAGE" -lc \
    'cd /usr/share/nginx/html/assets && tar -cf - -T /opt/acedata/release-assets' > "$tmp_dir/assets.tar"
else
  echo "Previous image has no release manifest; synthesizing one legacy release"
  docker run --rm --entrypoint sh "$PREVIOUS_IMAGE" -lc \
    'cd /usr/share/nginx/html/assets && tar -cf - .' > "$tmp_dir/assets.tar"
fi

tar -xf "$tmp_dir/assets.tar" -C "$output_dir"
if [ ! -f "$manifest_file" ]; then python3 deploy/release_assets.py manifest "$output_dir" "$manifest_file"; fi
python3 deploy/release_assets.py validate "$output_dir" "$manifest_file" "$MAX_RELEASE_FILES" "$MAX_RELEASE_BYTES"
