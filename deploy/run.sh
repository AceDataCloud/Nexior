#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${KUBE_CONTEXT:?KUBE_CONTEXT is required}"
case "$RELEASE_TAG" in [.-]*|*[!A-Za-z0-9_.-]*|latest) echo "Invalid RELEASE_TAG" >&2; exit 2 ;; esac
phase=${1:-}
case "$phase" in
  bridge) tag="$RELEASE_TAG-bridge"; manifests='studio-deployment.yaml' ;;
  final) tag="$RELEASE_TAG"; manifests='studio-service.yaml studio-proxy.yaml legacy-hub-redirect.yaml studio-ingress.yaml studio-deployment.yaml' ;;
  *) echo "Usage: $0 bridge|final" >&2; exit 2 ;;
esac
[ "${#tag}" -le 128 ] || { echo "Image tag is too long" >&2; exit 2; }

rendered=$(mktemp -d)
trap 'rm -rf "$rendered"' EXIT
set --
injector_sha=
proxy_sha=
if [ "$phase" = final ]; then
  injector=deploy/production/studio-html-injector.mjs
  proxy=deploy/production/studio-proxy.yaml
  injector_sha=$(openssl dgst -sha256 -r "$injector")
  injector_sha=${injector_sha%% *}
  proxy_sha=$(openssl dgst -sha256 -r "$proxy")
  proxy_sha=${proxy_sha%% *}
  python3 -c 'import json,pathlib,sys; print(json.dumps({"apiVersion":"v1","kind":"ConfigMap","metadata":{"name":"studio-html-injector","namespace":"acedatacloud"},"data":{"server.mjs":pathlib.Path(sys.argv[1]).read_text()}}))' "$injector" > "$rendered/studio-html-injector.yaml"
  set -- -f "$rendered/studio-html-injector.yaml"
fi
for manifest in $manifests; do
  sed -e 's/${TAG}/'"$tag"'/g' \
    -e 's/${INJECTOR_SHA}/'"$injector_sha"'/g' \
    -e 's/${PROXY_CONFIG_SHA}/'"$proxy_sha"'/g' \
    "deploy/production/$manifest" > "$rendered/$manifest"
  set -- "$@" -f "$rendered/$manifest"
done
kubectl --context "$KUBE_CONTEXT" apply "$@"
