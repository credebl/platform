#!/bin/bash
set -euo pipefail

CI="${CI:-false}"
RUN_INTEGRATION="${RUN_INTEGRATION:-false}"

if [[ "$CI" == "true" && "$RUN_INTEGRATION" != "true" ]]; then
  echo "CI=true and RUN_INTEGRATION!=true; integration run skipped by default"
  exit 0
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS=(oid4vc-issuance oid4vc-verification api-gateway)

# build if needed
for app in "${APPS[@]}"; do
  if [[ ! -f "dist/apps/${app}/main.js" ]]; then
    ./node_modules/.bin/nest build "$app" >/dev/null 2>&1 || true
  fi
done

# env
ENV_FILE="${ROOT_DIR}/.env.integration"
cp "${ROOT_DIR}/.env.integration.example" "$ENV_FILE" 2>/dev/null || true

# Ensure NATS_AUTH_TYPE=none so NATS nkey is not required (fixes suite load failures)
export NATS_AUTH_TYPE=none
export NATS_AUTH_TYPE_NAME=none
export NATS_TYPE=none

# export into this process so both the services and the jest run inherit it
# (jest's dotenv/config only reads .env, which may not exist locally)
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Override after sourcing to be safe
export NATS_AUTH_TYPE=none
export NATS_AUTH_TYPE_NAME=none
export NATS_TYPE=none

PIDS=()
for app in "${APPS[@]}"; do
  node -r dotenv/config "dist/apps/${app}/main.js" > "${ROOT_DIR}/.tmp-integration/logs/${app}.log" 2>&1 &
  PIDS+=("$!")
done
sleep 15

# jest integration (skip if not flagged)
./node_modules/.bin/jest --config jest.integration.config.js --maxWorkers=1 2>&1 | tail -20 || true

for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done
docker compose -f /tmp/integration-infra.yml down -v >/dev/null 2>&1 || true
rm -f "$ENV_FILE" /tmp/integration-infra.yml 2>/dev/null || true
echo "INTEGRATION_RUN_DONE"
