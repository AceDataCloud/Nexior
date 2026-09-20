#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=acedatacloud
DEPLOYMENT=caddy-studio-proxy
SERVICE=caddy-studio-proxy
SELECTOR=app=caddy-studio-proxy
INJECTOR=deploy/production/studio-html-injector.mjs
MANIFEST=deploy/production/studio-proxy.yaml
TARGET_IMAGE='caddy:2.11.4-alpine@sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'
TARGET_RUNTIME_DIGEST='sha256:040e9f7480b80b6d4a7e5013a21159b950a63dcbdb956e38abe2387fb28d9ec0'
INJECTOR_IMAGE='node:22.20.0-alpine@sha256:dbcedd8aeab47fbc0f4dd4bffa55b7c3c729a707875968d467aaaea42d6225af'
INJECTOR_RUNTIME_DIGEST='sha256:dbcedd8aeab47fbc0f4dd4bffa55b7c3c729a707875968d467aaaea42d6225af'
STEADY_VERIFY_HOSTS=${STEADY_VERIFY_HOSTS:-'studio-proxy.acedata.cloud'}
MIGRATION_VERIFY_HOSTS=${MIGRATION_VERIFY_HOSTS:-'apia.aipark.vip huyangy.xin juheai.ai studio-proxy.acedata.cloud studio.fesilent.com'}

rendered=$(mktemp)
preflight_pod="${DEPLOYMENT}-image-preflight-$$"
cleanup() {
  rm -f "$rendered"
  kubectl delete pod "$preflight_pod" -n "$NAMESPACE" --ignore-not-found --wait=false >/dev/null 2>&1 || true
}
trap cleanup EXIT

injector_sha=$(openssl dgst -sha256 "$INJECTOR" | awk '{print $NF}')
sed "s/\${INJECTOR_SHA}/$injector_sha/g" "$MANIFEST" > "$rendered"

deployment_name() {
  kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" --ignore-not-found -o name
}

deployment_image() {
  kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[?(@.name=="caddy")].image}'
}

migration_marker() {
  kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.metadata.annotations.acedata\.cloud/caddy-migration}'
}

pod_count() {
  local output
  output=$(kubectl get pods -n "$NAMESPACE" -l "$SELECTOR" --no-headers) || return 1
  printf '%s\n' "$output" | grep -c . || true
}

endpoint_count() {
  local output
  output=$(kubectl get endpoints "$SERVICE" -n "$NAMESPACE" -o jsonpath='{range .subsets[*].addresses[*]}{.ip}{"\n"}{end}') || return 1
  printf '%s\n' "$output" | grep -c . || true
}

all_live_pods_target() {
  local images image
  images=$(kubectl get pods -n "$NAMESPACE" -l "$SELECTOR" -o jsonpath='{range .items[*]}{.spec.containers[?(@.name=="caddy")].image}{"\n"}{end}') || return 1
  [ -n "$images" ] || return 1
  while IFS= read -r image; do
    [ "$image" = "$TARGET_IMAGE" ] || return 1
  done <<<"$images"
}

wait_for_zero() {
  local deadline pods endpoints
  deadline=$(( $(date +%s) + 300 ))
  while :; do
    pods=$(pod_count) || return 1
    endpoints=$(endpoint_count) || return 1
    [ "$pods" -eq 0 ] && [ "$endpoints" -eq 0 ] && return 0
    [ "$(date +%s)" -lt "$deadline" ] || { echo "Legacy Caddy pods or endpoints did not drain" >&2; return 1; }
    sleep 2
  done
}

wait_for_replicas() {
  local expected=$1 deadline desired ready available endpoints
  kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=5m || return 1
  deadline=$(( $(date +%s) + 300 ))
  while :; do
    desired=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}') || return 1
    ready=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}') || return 1
    available=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}') || return 1
    endpoints=$(endpoint_count) || return 1
    if [ "$desired" = "$expected" ] && [ "${ready:-0}" = "$expected" ] && [ "${available:-0}" = "$expected" ] && [ "$endpoints" = "$expected" ]; then
      return 0
    fi
    [ "$(date +%s)" -lt "$deadline" ] || { echo "$DEPLOYMENT did not converge to $expected replicas" >&2; return 1; }
    sleep 2
  done
}

verify_runtime() {
  local expected=$1 pods pod node image image_id version nodes injector_image injector_image_id injector_version ready
  pods=$(kubectl get pods -n "$NAMESPACE" -l "$SELECTOR" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}') || return 1
  [ "$(printf '%s\n' "$pods" | grep -c . || true)" = "$expected" ] || return 1
  nodes=''
  for pod in $pods; do
    image=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[?(@.name=="caddy")].image}') || return 1
    image_id=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[?(@.name=="caddy")].imageID}') || return 1
    node=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.nodeName}') || return 1
    version=$(kubectl exec "$pod" -n "$NAMESPACE" -c caddy -- caddy version) || return 1
    injector_image=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[?(@.name=="html-injector")].image}') || return 1
    injector_image_id=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[?(@.name=="html-injector")].imageID}') || return 1
    injector_version=$(kubectl exec "$pod" -n "$NAMESPACE" -c html-injector -- node --version) || return 1
    ready=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{range .status.containerStatuses[*]}{.ready}{"\n"}{end}') || return 1
    [ "$(printf '%s\n' "$ready" | grep -c '^true$' || true)" = 2 ] || { echo "$pod does not have two ready containers" >&2; return 1; }
    [ "$image" = "$TARGET_IMAGE" ] || { echo "$pod has unexpected image $image" >&2; return 1; }
    case "$image_id" in *"$TARGET_RUNTIME_DIGEST") ;; *) echo "$pod has unexpected runtime image $image_id" >&2; return 1 ;; esac
    case "$version" in v2.11.4*) ;; *) echo "$pod has unexpected Caddy version $version" >&2; return 1 ;; esac
    [ "$injector_image" = "$INJECTOR_IMAGE" ] || { echo "$pod has unexpected injector image $injector_image" >&2; return 1; }
    case "$injector_image_id" in *"$INJECTOR_RUNTIME_DIGEST") ;; *) echo "$pod has unexpected injector runtime image $injector_image_id" >&2; return 1 ;; esac
    [ "$injector_version" = v22.20.0 ] || { echo "$pod has unexpected Node version $injector_version" >&2; return 1; }
    nodes="$nodes$node\n"
    echo "$pod node=$node image_id=$image_id version=$version"
  done
  if [ "$expected" -gt 1 ]; then
    [ "$(printf '%b' "$nodes" | sort -u | grep -c . || true)" = "$expected" ] || { echo "Caddy replicas are not on distinct nodes" >&2; return 1; }
  fi
}

verify_metadata() {
  local pod host path
  pod=$(kubectl get pods -n "$NAMESPACE" -l "$SELECTOR" -o jsonpath='{.items[0].metadata.name}') || return 1
  for host in $MIGRATION_VERIFY_HOSTS; do
    path="/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/$host/$host.json"
    kubectl exec "$pod" -n "$NAMESPACE" -c caddy -- cat "$path" | python3 -m json.tool >/dev/null || return 1
  done
}

verify_tls() {
  local hosts=${1:-$STEADY_VERIFY_HOSTS} host status
  for host in $hosts; do
    status=$(curl --silent --show-error --head --connect-timeout 10 --max-time 20 --output /dev/null --write-out '%{http_code}' "https://$host/") || return 1
    case "$status" in 1??|2??|3??|4??) ;; *) echo "$host returned unhealthy HTTP $status" >&2; return 1 ;; esac
    echo "TLS verified: $host HTTP $status"
  done
}

preflight_cluster() {
  local nodes
  nodes=$(kubectl get nodes -l kubernetes.io/arch=amd64 --field-selector spec.unschedulable!=true -o name) || return 1
  [ "$(printf '%s\n' "$nodes" | grep -c . || true)" -ge 2 ] || { echo "At least two schedulable amd64 nodes are required" >&2; return 1; }
  grep -F "image: $TARGET_IMAGE" "$rendered" >/dev/null || { echo "Manifest image does not match the approved digest" >&2; return 1; }
}

preflight_image() {
  local image_id version
  kubectl delete pod "$preflight_pod" -n "$NAMESPACE" --ignore-not-found --wait=true >/dev/null || return 1
  kubectl run "$preflight_pod" -n "$NAMESPACE" --restart=Never --image="$TARGET_IMAGE" --overrides='{"spec":{"nodeSelector":{"kubernetes.io/arch":"amd64"}}}' --command -- caddy version >/dev/null || return 1
  if ! kubectl wait pod/"$preflight_pod" -n "$NAMESPACE" --for=jsonpath='{.status.phase}'=Succeeded --timeout=5m; then
    kubectl describe pod "$preflight_pod" -n "$NAMESPACE" >&2 || true
    kubectl logs "$preflight_pod" -n "$NAMESPACE" >&2 || true
    return 1
  fi
  version=$(kubectl logs "$preflight_pod" -n "$NAMESPACE") || return 1
  case "$version" in v2.11.4*) ;; *) echo "Caddy image preflight returned the wrong version" >&2; return 1 ;; esac
  image_id=$(kubectl get pod "$preflight_pod" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].imageID}') || return 1
  case "$image_id" in *"$TARGET_RUNTIME_DIGEST") ;; *) echo "Caddy preflight resolved unexpected image $image_id" >&2; return 1 ;; esac
}

apply_configmaps() {
  local injector_config caddy_config
  injector_config=$(mktemp)
  caddy_config=$(mktemp)
  kubectl create configmap studio-html-injector -n "$NAMESPACE" --from-file="server.mjs=$INJECTOR" --dry-run=client -o yaml >"$injector_config" || { rm -f "$injector_config" "$caddy_config"; return 1; }
  awk 'BEGIN { doc=1 } /^---$/ { exit } { print }' "$rendered" >"$caddy_config" || { rm -f "$injector_config" "$caddy_config"; return 1; }
  kubectl apply -f "$injector_config" || { rm -f "$injector_config" "$caddy_config"; return 1; }
  kubectl apply -f "$caddy_config" || { rm -f "$injector_config" "$caddy_config"; return 1; }
  rm -f "$injector_config" "$caddy_config"
}

render_single_manifest() {
  python3 - "$rendered" <<'PY'
import sys
import yaml

source = sys.argv[1]
documents = list(yaml.safe_load_all(open(source)))
for document in documents:
    if document and document.get("kind") == "Deployment" and document["metadata"]["name"] == "caddy-studio-proxy":
        document["spec"]["replicas"] = 1
        document["spec"]["strategy"] = {"type": "Recreate"}
yaml.safe_dump_all(documents, sys.stdout, sort_keys=False)
PY
}

single_replica_patch() {
  python3 -c 'import json,sys; print(json.dumps({"spec":{"replicas":1,"strategy":{"type":"Recreate","rollingUpdate":None},"template":{"metadata":{"annotations":{"acedata.cloud/html-injector-sha":sys.argv[2]}},"spec":{"nodeSelector":{"kubernetes.io/arch":"amd64"},"containers":[{"name":"caddy","image":sys.argv[1]}]}}}}))' "$TARGET_IMAGE" "$injector_sha"
}

recover_target_replica() {
  local patch
  echo "Migration failed; restoring one Caddy 2.11.4 replica only" >&2
  patch=$(single_replica_patch) || return 1
  kubectl patch deployment "$DEPLOYMENT" -n "$NAMESPACE" --type=strategic -p "$patch" || return 1
  wait_for_replicas 1 || return 1
  verify_runtime 1
}

start_target_single() {
  local patch
  patch=$(single_replica_patch) || return 1
  kubectl patch deployment "$DEPLOYMENT" -n "$NAMESPACE" --type=strategic -p "$patch" || return 1
  wait_for_replicas 1 || return 1
  verify_runtime 1 || return 1
  verify_metadata || return 1
  verify_tls "$MIGRATION_VERIFY_HOSTS"
}

wait_for_pdb() {
  local deadline disruptions
  deadline=$(( $(date +%s) + 120 ))
  while :; do
    disruptions=$(kubectl get pdb "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.disruptionsAllowed}') || return 1
    [ "${disruptions:-0}" -ge 1 ] && return 0
    [ "$(date +%s)" -lt "$deadline" ] || { echo "PDB did not allow one disruption" >&2; return 1; }
    sleep 2
  done
}

main() {
  local current_image existing_deployment marker already_migrated=false
  preflight_cluster || return 1
  preflight_image || return 1
  apply_configmaps || return 1

  existing_deployment=$(deployment_name) || return 1
  if [ -z "$existing_deployment" ]; then
    migration_manifest=$(mktemp)
    render_single_manifest >"$migration_manifest" || { rm -f "$migration_manifest"; return 1; }
    kubectl apply -f "$migration_manifest" || { rm -f "$migration_manifest"; return 1; }
    rm -f "$migration_manifest"
    wait_for_replicas 1 || return 1
    verify_runtime 1 || return 1
    verify_metadata || return 1
    verify_tls "$MIGRATION_VERIFY_HOSTS" || return 1
    kubectl apply -f "$rendered" || return 1
  else
    current_image=$(deployment_image) || return 1
    marker=$(migration_marker) || return 1
    if [ "$current_image" = "$TARGET_IMAGE" ] && [ "$marker" = certmagic-atomic-storage ] && all_live_pods_target; then
      already_migrated=true
    fi
    if [ "$already_migrated" != true ]; then
      if ! start_target_single; then
        recover_target_replica || true
        return 1
      fi
    fi
    kubectl apply -f "$rendered" || return 1
  fi

  wait_for_replicas 2 || return 1
  verify_runtime 2 || return 1
  verify_tls "$STEADY_VERIFY_HOSTS" || return 1
  wait_for_pdb || return 1
  kubectl annotate deployment "$DEPLOYMENT" -n "$NAMESPACE" \
    "acedata.cloud/caddy-image=$TARGET_IMAGE" \
    "acedata.cloud/caddy-migration=certmagic-atomic-storage" --overwrite
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  main "$@"
fi
