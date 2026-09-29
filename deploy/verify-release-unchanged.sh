#!/usr/bin/env bash
set -euo pipefail

: "${EXPECTED_IMAGE:?EXPECTED_IMAGE is required}"
: "${EXPECTED_TAGGED_IMAGE:?EXPECTED_TAGGED_IMAGE is required}"
: "${DEPLOYMENT:?DEPLOYMENT is required}"
: "${SERVICE:?SERVICE is required}"
: "${IMAGE_REPOSITORY:?IMAGE_REPOSITORY is required}"

tmp_env=$(mktemp)
cleanup() { rm -f "$tmp_env"; }
trap cleanup EXIT
GITHUB_ENV="$tmp_env" OUTPUT_PREFIX=CURRENT bash deploy/preflight-release.sh
# shellcheck disable=SC1090
source "$tmp_env"
if [ "$CURRENT_IMAGE" != "$EXPECTED_IMAGE" ] || [ "$CURRENT_TAGGED_IMAGE" != "$EXPECTED_TAGGED_IMAGE" ]; then
  echo "$DEPLOYMENT changed while release images were building" >&2
  echo "expected: $EXPECTED_TAGGED_IMAGE ($EXPECTED_IMAGE)" >&2
  echo "current:  $CURRENT_TAGGED_IMAGE ($CURRENT_IMAGE)" >&2
  exit 1
fi
