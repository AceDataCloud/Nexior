#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=acedatacloud
DEPLOYMENT=caddy-studio-proxy
SERVICE=caddy-studio-proxy
SELECTOR=app=caddy-studio-proxy
INJECTOR=deploy/production/studio-html-injector.mjs
MANIFEST=deploy/production/studio-proxy.yaml
TARGET_IMAGE='caddy:2.11.4-alpine@sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'
TARGET_RUNTIME_DIGEST='sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'
VERIFY_HOST=studio-proxy.acedata.cloud

rendered=$(mktemp)
trap 'rm -f "$rendered"' EXIT
injector_sha=$(openssl dgst -sha256 "$INJECTOR" | awk '{print $NF}')
sed "s/\${INJECTOR_SHA}/$injector_sha/g" "$MANIFEST" >"$rendered"

kubectl create configmap studio-html-injector -n "$NAMESPACE" \
  --from-file="server.mjs=$INJECTOR" --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$rendered"
kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=10m

pods=$(kubectl get pods -n "$NAMESPACE" -l "$SELECTOR" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}')
[ "$(printf '%s\n' "$pods" | grep -c . || true)" = 2 ] || { echo "Expected two Caddy pods" >&2; exit 1; }
nodes=''
for pod in $pods; do
  image=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[?(@.name=="caddy")].image}')
  image_id=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[?(@.name=="caddy")].imageID}')
  version=$(kubectl exec "$pod" -n "$NAMESPACE" -c caddy -- caddy version)
  node=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.nodeName}')
  [ "$image" = "$TARGET_IMAGE" ]
  case "$image_id" in *"$TARGET_RUNTIME_DIGEST") ;; *) echo "$pod has unexpected runtime image $image_id" >&2; exit 1 ;; esac
  case "$version" in v2.11.4*) ;; *) echo "$pod has unexpected Caddy version $version" >&2; exit 1 ;; esac
  nodes="$nodes$node\n"
done
[ "$(printf '%b' "$nodes" | sort -u | grep -c . || true)" = 2 ] || { echo "Caddy replicas are not on distinct nodes" >&2; exit 1; }
[ "$(kubectl get endpoints "$SERVICE" -n "$NAMESPACE" -o jsonpath='{range .subsets[*].addresses[*]}{.ip}{"\n"}{end}' | grep -c . || true)" = 2 ]
[ "$(kubectl get pdb "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.disruptionsAllowed}')" -ge 1 ]
curl --silent --show-error --head --connect-timeout 10 --max-time 20 "https://$VERIFY_HOST/" >/dev/null
