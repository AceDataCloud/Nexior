#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=acedatacloud
DEPLOYMENT=caddy-studio-proxy
SERVICE=caddy-studio-proxy
INTERNAL_SERVICE=caddy-studio-internal
SELECTOR=app=caddy-studio-proxy
INJECTOR=deploy/production/studio-html-injector.mjs
MANIFEST=deploy/production/studio-proxy.yaml
TARGET_IMAGE='caddy:2.11.4-alpine@sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'
TARGET_RUNTIME_DIGEST='sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'
VERIFY_HOST=studio-proxy.acedata.cloud

rendered=$(mktemp)
trap 'rm -f "$rendered"' EXIT
injector_sha=$(openssl dgst -sha256 "$INJECTOR" | awk '{print $NF}')
proxy_config_sha=$(openssl dgst -sha256 "$MANIFEST" | awk '{print $NF}')
sed -e "s/\${INJECTOR_SHA}/$injector_sha/g" \
  -e "s/\${PROXY_CONFIG_SHA}/$proxy_config_sha/g" \
  "$MANIFEST" >"$rendered"

kubectl create configmap studio-html-injector -n "$NAMESPACE" \
  --from-file="server.mjs=$INJECTOR" --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$rendered"
kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=10m

pods=$(kubectl get pods -n "$NAMESPACE" -l "$SELECTOR" -o json | python3 -c '
import json, sys
for pod in json.load(sys.stdin)["items"]:
    if pod["metadata"].get("deletionTimestamp"):
        continue
    statuses = pod.get("status", {}).get("containerStatuses", [])
    if statuses and all(item.get("ready") for item in statuses):
        print(pod["metadata"]["name"])
')
[ "$(printf '%s\n' "$pods" | grep -c . || true)" = 2 ] || { echo "Expected two ready, non-terminating Caddy pods" >&2; exit 1; }
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
for service in "$SERVICE" "$INTERNAL_SERVICE"; do
  [ "$(kubectl get endpoints "$service" -n "$NAMESPACE" -o jsonpath='{range .subsets[*].addresses[*]}{.ip}{"\n"}{end}' | grep -c . || true)" = 2 ]
done
[ "$(kubectl get pdb "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.disruptionsAllowed}')" -ge 1 ]

pod=$(printf '%s\n' "$pods" | head -n 1)
kubectl exec "$pod" -n "$NAMESPACE" -c html-injector -- node -e '
const http = require("node:http");
const host = "apio.studio.acedata.cloud";
const internal = new Promise((resolve, reject) => {
  const request = http.get({ hostname: "caddy-studio-internal", port: 8080, path: "/", headers: { Host: host } }, response => {
    const chunks = [];
    response.on("data", chunk => chunks.push(chunk));
    response.on("end", () => resolve({ ok: response.statusCode === 200, html: Buffer.concat(chunks).toString() }));
  });
  request.on("error", reject);
});
Promise.all([
  fetch(`https://platform.acedata.cloud/api/v1/site-head/${host}`).then(response => response.json()),
  internal
]).then(([metadata, page]) => {
  if (!page.ok || !page.html.includes(`<title>${metadata.title}</title>`) || !page.html.includes(metadata.favicon)) process.exit(1);
}).catch(() => process.exit(1));
'
curl --silent --show-error --head --connect-timeout 10 --max-time 20 "https://$VERIFY_HOST/" >/dev/null
