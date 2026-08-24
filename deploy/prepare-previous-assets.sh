#!/usr/bin/env bash
set -euo pipefail

: "${PREVIOUS_POD:?PREVIOUS_POD is required}"
: "${MAX_RELEASE_FILES:?MAX_RELEASE_FILES is required}"
: "${MAX_RELEASE_BYTES:?MAX_RELEASE_BYTES is required}"

output_dir=${OUTPUT_DIR:-.previous-assets}
manifest_file=${MANIFEST_FILE:-.previous-release-assets}
tmp_dir=$(mktemp -d)
cleanup() { rm -rf "$tmp_dir"; }
trap cleanup EXIT

rm -rf "$output_dir"
mkdir -p "$output_dir"
if kubectl exec -n acedatacloud "$PREVIOUS_POD" -- test -f /opt/acedata/release-assets 2>/dev/null; then
  kubectl exec -n acedatacloud "$PREVIOUS_POD" -- cat /opt/acedata/release-assets > "$manifest_file"
  python3 deploy/release_assets.py check-list "$manifest_file" "$MAX_RELEASE_FILES"
  kubectl exec -n acedatacloud "$PREVIOUS_POD" -- sh -lc \
    'cd /usr/share/nginx/html/assets && tar -cf - -T /opt/acedata/release-assets | gzip -c | base64' | \
    python3 deploy/release_assets.py decode "$tmp_dir/assets.tar"
else
  echo "Previous image has no release manifest; synthesizing one legacy release"
  kubectl exec -n acedatacloud "$PREVIOUS_POD" -- sh -lc \
    'cd /usr/share/nginx/html/assets && tar -cf - . | gzip -c | base64' | \
    python3 deploy/release_assets.py decode "$tmp_dir/assets.tar"
fi

tar -xf "$tmp_dir/assets.tar" -C "$output_dir"
if [ ! -f "$manifest_file" ]; then
  python3 deploy/release_assets.py manifest "$output_dir" "$manifest_file"
fi
python3 deploy/release_assets.py validate \
  "$output_dir" "$manifest_file" "$MAX_RELEASE_FILES" "$MAX_RELEASE_BYTES"
