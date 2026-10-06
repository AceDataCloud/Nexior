#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${PREVIOUS_TAGGED_IMAGE:?PREVIOUS_TAGGED_IMAGE is required}"
NAMESPACE=acedatacloud
DEPLOYMENT=studio-frontend
CONTAINER=studio-frontend
SERVICE=studio-frontend
MANIFEST=deploy/production/studio-deployment.yaml
IMAGE_REPOSITORY=ghcr.io/acedatacloud/studio-frontend

wait_converged() {
  local deployment=$1 service=$2 expected_image=$3 expected_repository snapshot deadline
  expected_repository=${expected_image%@*}
  if [ "$expected_repository" = "$expected_image" ]; then expected_repository=${expected_image%:*}; fi
  kubectl rollout status "deployment/$deployment" -n "$NAMESPACE" --timeout=30m || return 1
  snapshot=$(mktemp)
  deadline=$(( $(date +%s) + 300 ))
  while :; do
    : > "$snapshot"
    if DEPLOYMENT="$deployment" SERVICE="$service" IMAGE_REPOSITORY="$expected_repository" \
       GITHUB_ENV="$snapshot" OUTPUT_PREFIX=ROLLED bash deploy/preflight-release.sh && \
       grep -Fxq "ROLLED_TAGGED_IMAGE=$expected_image" "$snapshot"; then
      rm -f "$snapshot"
      return 0
    fi
    if [ "$(date +%s)" -ge "$deadline" ]; then
      echo "$deployment/$service did not converge to $expected_image" >&2
      rm -f "$snapshot"
      return 1
    fi
    sleep 2
  done
}

apply_stage() {
  local tag=$1
  sed "s|\${TAG}|$tag|g" "$MANIFEST" | kubectl apply -f -
}

rollback() {
  local image=$1
  echo "Rolling $DEPLOYMENT back to $image" >&2
  kubectl set image "deployment/$DEPLOYMENT" "$CONTAINER=$image" -n "$NAMESPACE"
  wait_converged "$DEPLOYMENT" "$SERVICE" "$image" || true
}

roll_stage() {
  local tag=$1 fallback=$2
  local expected="$IMAGE_REPOSITORY:$tag"
  apply_stage "$tag" || return 1
  if ! wait_converged "$DEPLOYMENT" "$SERVICE" "$expected"; then
    rollback "$fallback"
    return 1
  fi
}

roll_stage "${RELEASE_TAG}-bridge" "$PREVIOUS_TAGGED_IMAGE"
roll_stage "$RELEASE_TAG" "ghcr.io/acedatacloud/studio-frontend:${RELEASE_TAG}-bridge"

if ! python3 deploy/verify-html-assets.py "https://studio.acedata.cloud/"; then
  rollback "ghcr.io/acedatacloud/studio-frontend:${RELEASE_TAG}-bridge"
  exit 1
fi
