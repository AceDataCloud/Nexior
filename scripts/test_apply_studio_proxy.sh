#!/usr/bin/env bash
set -euo pipefail

SCRIPT=deploy/apply-studio-proxy.sh
TARGET='caddy:2.11.4-alpine@sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'

run_case() {
  local current=$1 fail_stage=${2:-} log
  log=$(mktemp)
  (
    source "$SCRIPT"
    trap - EXIT
    cleanup() { :; }
    preflight_cluster() { echo preflight_cluster >>"$log"; }
    preflight_image() { echo preflight_image >>"$log"; [ "$fail_stage" != preflight ]; }
    apply_configmaps() { echo apply_configmaps >>"$log"; }
    deployment_name() { echo deployment.apps/caddy-studio-proxy; }
    deployment_image() { printf '%s' "$current"; }
    migration_marker() { if [ "$fail_stage" != unmarked ]; then printf certmagic-atomic-storage; fi; return 0; }
    all_live_pods_target() { [ "$current" = "$TARGET" ] && [ "$fail_stage" != mixed ]; }
    wait_for_zero() { echo wait_zero >>"$log"; }
    wait_for_replicas() { echo "wait_$1" >>"$log"; }
    verify_runtime() { echo "runtime_$1" >>"$log"; }
    verify_metadata() { echo metadata >>"$log"; }
    verify_tls() { echo tls >>"$log"; [ "$fail_stage" != tls ]; }
    date() { command date "$@"; }
    kubectl() {
      echo "kubectl $*" >>"$log"
      if [ "${1:-}" = get ] && [ "${2:-}" = pdb ]; then printf 1; fi
    }
    main || exit $?
  )
  local status=$?
  cat "$log"
  rm -f "$log"
  return "$status"
}

legacy_log=$(run_case 'caddy:2.8-alpine')
patch_line=$(grep -n 'kubectl patch deployment' <<<"$legacy_log" | cut -d: -f1)
one_line=$(grep -n '^runtime_1$' <<<"$legacy_log" | cut -d: -f1)
final_apply_line=$(grep -n 'kubectl apply -f' <<<"$legacy_log" | tail -1 | cut -d: -f1)
two_line=$(grep -n '^runtime_2$' <<<"$legacy_log" | cut -d: -f1)
[ "$patch_line" -lt "$one_line" ] && [ "$one_line" -lt "$final_apply_line" ] && [ "$final_apply_line" -lt "$two_line" ]


mixed_log=$(run_case "$TARGET" mixed)
grep -q 'kubectl patch deployment' <<<"$mixed_log"
grep -q '^runtime_1$' <<<"$mixed_log"

unmarked_log=$(run_case "$TARGET" unmarked)
grep -q 'kubectl patch deployment' <<<"$unmarked_log"
grep -q '^metadata$' <<<"$unmarked_log"

steady_log=$(run_case "$TARGET")
if grep -q 'kubectl patch deployment\|runtime_1' <<<"$steady_log"; then
  echo 'steady-state path performed a migration action' >&2
  exit 1
fi
grep -q '^runtime_2$' <<<"$steady_log"

if run_case 'caddy:2.8-alpine' preflight >/dev/null 2>&1; then
  echo 'preflight failure unexpectedly succeeded' >&2
  exit 1
fi

failure_log=$(mktemp)
if run_case 'caddy:2.8-alpine' tls >"$failure_log" 2>&1; then
  echo 'TLS failure unexpectedly succeeded' >&2
  exit 1
fi
if grep -q '^runtime_2$' "$failure_log"; then
  echo 'failed migration proceeded to two replicas' >&2
  exit 1
fi
if grep -q 'rollout undo' "$failure_log"; then
  echo 'failed migration attempted a legacy rollback' >&2
  exit 1
fi
rm -f "$failure_log"

echo 'Studio proxy rollout state machine OK'

# Exercise the real fail-closed helpers; do not mock the function under test.
(
  source "$SCRIPT"
  trap - EXIT
  curl() { return 35; }
  if verify_tls 'broken.example'; then
    echo 'verify_tls swallowed a TLS failure' >&2
    exit 1
  fi
)

(
  source "$SCRIPT"
  trap - EXIT
  kubectl() { return 1; }
  if pod_count >/dev/null; then
    echo 'pod_count converted a Kubernetes error to zero' >&2
    exit 1
  fi
  if endpoint_count >/dev/null; then
    echo 'endpoint_count converted a Kubernetes error to zero' >&2
    exit 1
  fi
  if deployment_name >/dev/null; then
    echo 'deployment lookup converted a Kubernetes error to not found' >&2
    exit 1
  fi
)

(
  source "$SCRIPT"
  trap - EXIT
  apply_calls=0
  kubectl() {
    if [ "${1:-}" = create ]; then
      printf 'kind: ConfigMap\n'
      return 0
    fi
    if [ "${1:-}" = apply ]; then
      apply_calls=$((apply_calls + 1))
      [ "$apply_calls" -ne 1 ]
      return
    fi
    return 0
  }
  if apply_configmaps; then
    echo 'apply_configmaps swallowed the injector apply failure' >&2
    exit 1
  fi
  [ "$apply_calls" -eq 1 ] || {
    echo 'apply_configmaps continued after the injector failure' >&2
    exit 1
  }
)

echo 'Studio proxy fail-closed helpers OK'
