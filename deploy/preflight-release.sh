#!/usr/bin/env bash
set -euo pipefail
: "${KUBE_CONTEXT:?KUBE_CONTEXT is required}"

: "${DEPLOYMENT:?DEPLOYMENT is required}"
: "${SERVICE:?SERVICE is required}"
: "${IMAGE_REPOSITORY:?IMAGE_REPOSITORY is required}"
NAMESPACE=${NAMESPACE:-acedatacloud}
ENV_FILE=${GITHUB_ENV:-/dev/stdout}
OUTPUT_PREFIX=${OUTPUT_PREFIX:-PREVIOUS}

desired=$(kubectl --context "$KUBE_CONTEXT" get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
generation=$(kubectl --context "$KUBE_CONTEXT" get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.metadata.generation}')
observed=$(kubectl --context "$KUBE_CONTEXT" get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.observedGeneration}')
updated=$(kubectl --context "$KUBE_CONTEXT" get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.updatedReplicas}')
ready=$(kubectl --context "$KUBE_CONTEXT" get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
available=$(kubectl --context "$KUBE_CONTEXT" get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}')
unavailable=$(kubectl --context "$KUBE_CONTEXT" get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.unavailableReplicas}')

if [ "$observed" != "$generation" ] || [ "$updated" != "$desired" ] || \
   [ "$ready" != "$desired" ] || [ "$available" != "$desired" ] || \
   { [ -n "$unavailable" ] && [ "$unavailable" != 0 ]; }; then
  echo "$DEPLOYMENT is not fully converged" >&2
  exit 1
fi

pods=$(kubectl --context "$KUBE_CONTEXT" get endpoints "$SERVICE" -n "$NAMESPACE" \
  -o jsonpath='{range .subsets[*].addresses[*]}{.targetRef.name}{"\n"}{end}')
if [ "$(printf '%s\n' "$pods" | grep -c . || true)" != "$desired" ]; then
  echo "$SERVICE endpoint count does not match $DEPLOYMENT replicas" >&2
  exit 1
fi

spec_image=
image_id=
for pod in $pods; do
  pod_image=$(kubectl --context "$KUBE_CONTEXT" get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[0].image}')
  pod_image_id=$(kubectl --context "$KUBE_CONTEXT" get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].imageID}')
  case "$pod_image" in "$IMAGE_REPOSITORY":*|"$IMAGE_REPOSITORY"@sha256:*) ;; *) echo "Unexpected image: $pod_image" >&2; exit 1 ;; esac
  case "$pod_image_id" in "$IMAGE_REPOSITORY"@sha256:*) ;; *) echo "Unexpected image ID: $pod_image_id" >&2; exit 1 ;; esac
  if [ -n "$spec_image" ] && { [ "$pod_image" != "$spec_image" ] || [ "$pod_image_id" != "$image_id" ]; }; then
    echo "$SERVICE endpoints run mixed images" >&2
    exit 1
  fi
  spec_image=$pod_image
  image_id=$pod_image_id
done

if { [ -n "${EXPECTED_IMAGE:-}" ] && [ "$image_id" != "$EXPECTED_IMAGE" ]; } ||
   { [ -n "${EXPECTED_TAGGED_IMAGE:-}" ] && [ "$spec_image" != "$EXPECTED_TAGGED_IMAGE" ]; }; then
  echo "$DEPLOYMENT image differs from the expected release" >&2
  exit 1
fi
printf '%s_IMAGE=%s\n' "$OUTPUT_PREFIX" "$image_id" >> "$ENV_FILE"
printf '%s_TAGGED_IMAGE=%s\n' "$OUTPUT_PREFIX" "$spec_image" >> "$ENV_FILE"
printf 'previous_image=%s\n' "$image_id"
