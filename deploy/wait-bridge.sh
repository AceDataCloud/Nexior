#!/usr/bin/env bash
# This barrier prevents new HTML reaching old backends without its hash assets.
set -euo pipefail
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${KUBE_CONTEXT:?KUBE_CONTEXT is required}"
: "${DEPLOYMENT:?DEPLOYMENT is required}"
: "${SERVICE:?SERVICE is required}"
: "${IMAGE_REPOSITORY:?IMAGE_REPOSITORY is required}"
NAMESPACE=${NAMESPACE:-acedatacloud}
expected="$IMAGE_REPOSITORY:$RELEASE_TAG-bridge"
kubectl --context "$KUBE_CONTEXT" rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=40m
deadline=$(( $(date +%s) + 300 ))
while :; do
  if GITHUB_ENV=/dev/null EXPECTED_TAGGED_IMAGE="$expected" bash deploy/preflight-release.sh &&
     kubectl --context "$KUBE_CONTEXT" get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT" -o json |
       python3 -c 'import json,sys; pods=json.load(sys.stdin)["items"]; active=[p for p in pods if p.get("status",{}).get("phase") not in ("Succeeded","Failed")]; sys.exit(0 if active and all(p["spec"]["containers"][0]["image"] == sys.argv[1] for p in active) else 1)' "$expected"; then
    exit 0
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "Compatible bridge endpoints did not converge; final was not applied" >&2
    exit 1
  fi
  sleep 2
done
