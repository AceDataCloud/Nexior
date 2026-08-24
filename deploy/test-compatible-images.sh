#!/usr/bin/env bash
set -euo pipefail

: "${IMAGE_NAME:?IMAGE_NAME is required}"
previous_image="$IMAGE_NAME:ci-previous"
bridge_image="$IMAGE_NAME:ci-bridge"
final_image="$IMAGE_NAME:ci-final"
current_image="$IMAGE_NAME:ci-current"

[ ! -e .previous-assets ] || { echo '.previous-assets already exists' >&2; exit 1; }
[ ! -e .previous-release-assets ] || { echo '.previous-release-assets already exists' >&2; exit 1; }
cleanup() { rm -rf .previous-assets .previous-release-assets "$tmp_dir"; }
tmp_dir=$(mktemp -d)
trap cleanup EXIT

mkdir .previous-assets
printf 'previous release fixture\n' > .previous-assets/old-ci.js
printf 'old-ci.js\n' > .previous-release-assets

docker build --target production-stage -t "$current_image" .
cat > "$tmp_dir/Dockerfile" <<'DOCKERFILE'
ARG CURRENT_IMAGE
FROM ${CURRENT_IMAGE}
COPY old-ci.js /usr/share/nginx/html/assets/old-ci.js
COPY release-assets /opt/acedata/release-assets
DOCKERFILE
cp .previous-assets/old-ci.js "$tmp_dir/old-ci.js"
cp .previous-release-assets "$tmp_dir/release-assets"
docker build --build-arg "CURRENT_IMAGE=$current_image" -t "$previous_image" "$tmp_dir"
docker build --target bridge --build-arg "PREVIOUS_IMAGE=$previous_image" -t "$bridge_image" .
docker build --target final --build-arg "PREVIOUS_IMAGE=$previous_image" -t "$final_image" .

previous_index=$(docker run --rm --entrypoint sha256sum "$previous_image" /usr/share/nginx/html/index.html | cut -d' ' -f1)
bridge_index=$(docker run --rm --entrypoint sha256sum "$bridge_image" /usr/share/nginx/html/index.html | cut -d' ' -f1)
[ "$previous_index" = "$bridge_index" ]
for image in "$bridge_image" "$final_image"; do
  docker run --rm --entrypoint sh "$image" -lc '
    test -f /usr/share/nginx/html/assets/old-ci.js
    test -s /opt/acedata/release-assets
    release_asset=$(sed -n "1p" /opt/acedata/release-assets)
    test -f "/usr/share/nginx/html/assets/$release_asset"
  '
done
