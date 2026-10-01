#!/usr/bin/env bash
# Canonical benchmark entrypoint. Deterministic, offline, no clock dependency.
# Primary metric: invalid (harness spec violations). Secondary: content + feature coverage.
set -euo pipefail
cd "$(dirname "$0")"

node build.mjs
node tests/smoke.cjs

echo "METRIC harness_ok=1"
