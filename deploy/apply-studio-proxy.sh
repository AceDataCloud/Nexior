#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=${NAMESPACE:-acedatacloud}
INJECTOR=deploy/production/studio-html-injector.mjs
MANIFEST=deploy/production/studio-proxy.yaml

kubectl create configmap studio-html-injector \
  --namespace "$NAMESPACE" \
  --from-file="server.mjs=$INJECTOR" \
  --dry-run=client -o yaml | kubectl apply -f -
injector_sha=$(openssl dgst -sha256 "$INJECTOR" | awk '{print $NF}')
sed "s/\${INJECTOR_SHA}/$injector_sha/g" "$MANIFEST" | kubectl apply -f -
