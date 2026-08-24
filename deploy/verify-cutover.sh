#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${PREVIOUS_IMAGE:?PREVIOUS_IMAGE is required}"
: "${PREVIOUS_TAGGED_IMAGE:?PREVIOUS_TAGGED_IMAGE is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"
NAMESPACE=acedatacloud
DEPLOYMENT=studio-frontend
CONTAINER=studio-frontend
SERVICE=studio-frontend
MANIFEST=deploy/production/studio-deployment.yaml
IMAGE_REPOSITORY=ghcr.io/acedatacloud/studio-frontend

wait_converged() {
  local deployment=$1 service=$2 expected_image=$3 expected_repository
  expected_repository=${expected_image%@*}
  if [ "$expected_repository" = "$expected_image" ]; then expected_repository=${expected_image%:*}; fi
  kubectl rollout status "deployment/$deployment" -n "$NAMESPACE" --timeout=20m
  local deadline=$(( $(date +%s) + 300 ))
  while :; do
    local desired observed generation updated ready available unavailable endpoints pod image image_id expected_image_id all_ready
    desired=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
    generation=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.metadata.generation}')
    observed=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.observedGeneration}')
    updated=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.updatedReplicas}')
    ready=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    available=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}')
    unavailable=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.unavailableReplicas}')
    endpoints=$(kubectl get endpoints "$service" -n "$NAMESPACE" -o jsonpath='{range .subsets[*].addresses[*]}{.targetRef.name}{"\n"}{end}' 2>/dev/null || true)
    all_ready=true
    [ "$observed" = "$generation" ] || all_ready=false
    [ "$updated" = "$desired" ] || all_ready=false
    [ "$ready" = "$desired" ] || all_ready=false
    [ "$available" = "$desired" ] || all_ready=false
    [ -z "$unavailable" ] || [ "$unavailable" = 0 ] || all_ready=false
    [ "$(printf '%s\n' "$endpoints" | grep -c . || true)" = "$desired" ] || all_ready=false
    for pod in $endpoints; do
      image=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[0].image}' 2>/dev/null || true)
      image_id=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].imageID}' 2>/dev/null || true)
      [ "$image" = "$expected_image" ] || all_ready=false
      case "$image_id" in "$expected_repository"@sha256:*) ;; *) all_ready=false ;; esac
      if [ -n "${expected_image_id:-}" ] && [ "$image_id" != "$expected_image_id" ]; then all_ready=false; fi
      expected_image_id=$image_id
    done
    if [ "$all_ready" = true ]; then
      return 0
    fi
    if [ "$(date +%s)" -ge "$deadline" ]; then
      echo "$deployment/$service did not converge to $expected_image" >&2
      kubectl get deployment "$deployment" -n "$NAMESPACE" -o wide || true
      kubectl get pods -n "$NAMESPACE" -l "app=$deployment" -o wide || true
      kubectl get endpoints "$service" -n "$NAMESPACE" -o wide || true
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
  local tag=$1 fallback=$2 expected="$IMAGE_REPOSITORY:$tag"
  apply_stage "$tag"
  if ! wait_converged "$DEPLOYMENT" "$SERVICE" "$expected"; then
    rollback "$fallback"
    return 1
  fi
}

kubectl apply -f deploy/production/studio-service.yaml
kubectl apply -f deploy/production/studio-ingress.yaml
kubectl apply -f deploy/production/studio-proxy.yaml
kubectl apply -f deploy/production/legacy-hub-redirect.yaml
roll_stage "${RELEASE_TAG}-bridge" "$PREVIOUS_TAGGED_IMAGE"
roll_stage "$RELEASE_TAG" "ghcr.io/acedatacloud/studio-frontend:${RELEASE_TAG}-bridge"

if ! python3 deploy/verify-html-assets.py "https://studio.acedata.cloud/"; then
  rollback "ghcr.io/acedatacloud/studio-frontend:${RELEASE_TAG}-bridge"
  exit 1
fi
for legacy_url in \
  'https://hub.acedata.cloud/retired-check?keep=1' \
  'https://retired-check.hub.acedata.cloud/retired-check?keep=1'; do
  location=$(curl -fsSI "$legacy_url" | tr -d '\r' | awk 'tolower($1)=="location:" {print $2; exit}')
  test "$location" = "https://studio.acedata.cloud/retired-check?keep=1"
done

kubectl annotate deployment "$DEPLOYMENT" -n "$NAMESPACE" \
  "acedata.cloud/last-successful-revision=$GITHUB_SHA" \
  "acedata.cloud/release-id=$RELEASE_TAG" \
  "acedata.cloud/release-phase=final" --overwrite
