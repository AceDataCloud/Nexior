#!/usr/bin/env bash
set -euo pipefail

app=${1:?app name is required}
tmp_dir=$(mktemp -d)
final_image="acedata/${app}:compat-final"
fixture_image="acedata/${app}:compat-previous"
final_container=
cleanup() {
  [ -z "$final_container" ] || docker rm -f "$final_container" >/dev/null 2>&1 || true
  rm -rf "$tmp_dir" .previous-assets .previous-release-assets
}
trap cleanup EXIT

mkdir -p "$tmp_dir/fixture" .previous-assets
cat > "$tmp_dir/fixture/Dockerfile" <<'DOCKERFILE'
FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/* && mkdir -p /usr/share/nginx/html/assets /opt/acedata && \
    printf '%s\n' '<!doctype html><script src="/assets/old.js"></script><p>previous-release-marker</p>' > /usr/share/nginx/html/index.html && \
    printf '%s\n' 'console.log("old")' > /usr/share/nginx/html/assets/old.js && \
    printf '%s\n' 'old.js' > /opt/acedata/release-assets
DOCKERFILE
docker build -q -t "$fixture_image" "$tmp_dir/fixture"
printf '%s\n' 'console.log("old")' > .previous-assets/old.js
printf '%s\n' 'old.js' > .previous-release-assets

docker build -q -t "acedata/${app}:compat-default" .
docker build -q --target final --build-arg "PREVIOUS_IMAGE=$fixture_image" -t "$final_image" .

run_image() {
  local name=$1 image=$2
  shift 2
  docker run -d --name "$name" "$@" "$image"
  for _ in $(seq 1 30); do
    docker exec "$name" wget -qO- http://127.0.0.1/ >/dev/null 2>&1 && return 0
    sleep 1
  done
  docker logs "$name" >&2
  return 1
}

final_container="${app}-compat-final"
if [ "$app" = platform-frontend ]; then
  run_image "$final_container" "$final_image" \
    -e AUTH_BACKEND_URL=http://127.0.0.1 \
    -e PLATFORM_BACKEND_URL=http://127.0.0.1 \
    -e DEBUG_AGENT_URL=http://127.0.0.1 \
    -e SHORTURL_BACKEND_URL=http://127.0.0.1 \
    -e AICHAT_BACKEND_URL=http://127.0.0.1 \
    -e EXCHANGE_RATE_BACKEND_URL=http://127.0.0.1
else
  run_image "$final_container" "$final_image"
fi

if docker exec "$final_container" wget -qO- http://127.0.0.1/ | grep -q previous-release-marker; then
  echo 'final image still serves previous HTML' >&2
  exit 1
fi
docker exec "$final_container" wget -qO- http://127.0.0.1/assets/old.js | grep -q 'console.log'
current_asset=$(docker exec "$final_container" sed -n '1p' /opt/acedata/release-assets)
[ -n "$current_asset" ]
docker exec "$final_container" wget -qO- "http://127.0.0.1/assets/$current_asset" >/dev/null

echo "compatible final image verified for $app"
