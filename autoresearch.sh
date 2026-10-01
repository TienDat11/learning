#!/usr/bin/env bash
# Canonical benchmark entrypoint. Deterministic, offline, no clock dependency.
# Runs the full workload (build -> smoke -> score) and prints METRIC lines.
# Primary metric: readiness (0-100, higher = closer to done). Secondary: gaps.
#
# Exit 0 whenever the workload COULD BE SCORED. Content-invalid (build 1) and
# smoke-failure (smoke 1) are scored states, not harness failures. Non-zero only
# when the build crashed without emitting dist/metrics.json.
set -uo pipefail
cd "$(dirname "$0")"

mkdir -p dist
rm -f dist/metrics.json dist/smoke.json dist/build.log dist/smoke.log

echo "== build =="
node build.mjs > dist/build.log 2>&1; build_rc=$?
grep -E '^(INVALID|FATAL|FAILED|OK):' dist/build.log | head -n 60 || true
if [ ! -f dist/metrics.json ]; then
  echo "HARNESS FAILURE: build did not produce dist/metrics.json (exit ${build_rc})"
  tail -n 30 dist/build.log || true
  exit 2
fi

echo "== smoke =="
node tests/smoke.cjs > dist/smoke.log 2>&1 || true
grep -E '^(SMOKE FAIL|FATAL|FAILED|OK):' dist/smoke.log | head -n 60 || true

echo "== metrics =="
node tests/score.cjs
exit $?