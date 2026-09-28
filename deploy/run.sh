#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_TAG:?RELEASE_TAG is required}"
rendered=$(mktemp)
trap 'rm -f "$rendered"' EXIT
injector=deploy/production/studio-html-injector.mjs
proxy=deploy/production/studio-proxy.yaml
injector_sha=$(openssl dgst -sha256 "$injector" | awk '{print $NF}')
proxy_sha=$(openssl dgst -sha256 "$proxy" | awk '{print $NF}')

kubectl create configmap studio-html-injector -n acedatacloud \
  --from-file="server.mjs=$injector" --dry-run=client -o yaml > "$rendered"
for manifest in studio-service.yaml studio-proxy.yaml legacy-hub-redirect.yaml studio-deployment.yaml studio-ingress.yaml; do
  printf '%s\n' '---' >> "$rendered"
  sed -e "s|\${TAG}|$RELEASE_TAG|g" \
    -e "s|\${INJECTOR_SHA}|$injector_sha|g" \
    -e "s|\${PROXY_CONFIG_SHA}|$proxy_sha|g" \
    "deploy/production/$manifest" >> "$rendered"
done
kubectl apply -f "$rendered"
