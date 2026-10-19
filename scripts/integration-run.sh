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

# build (always; a stale dist must not mask a broken build)
for app in "${APPS[@]}"; do
  ./node_modules/.bin/nest build "$app" >/dev/null
done

# env: reuse an existing .env.integration (developers may have adjusted it);
# only create it from the example when missing, and only remove what we created
ENV_FILE="${ROOT_DIR}/.env.integration"
CREATED_ENV=false
if [[ ! -f "$ENV_FILE" ]]; then
  cp "${ROOT_DIR}/.env.integration.example" "$ENV_FILE"
  CREATED_ENV=true
fi

# Ensure NATS_AUTH_TYPE=none so NATS nkey is not required (fixes suite load failures)
export NATS_AUTH_TYPE=none
export NATS_AUTH_TYPE_NAME=none
export NATS_TYPE=none

# export into this process so both the services and the jest run inherit it
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Override after sourcing to be safe
export NATS_AUTH_TYPE=none
export NATS_AUTH_TYPE_NAME=none
export NATS_TYPE=none

# point the app preload and jest's dotenv/config at the integration env file
export DOTENV_CONFIG_PATH="$ENV_FILE"

mkdir -p "${ROOT_DIR}/.tmp-integration/logs"
PIDS=()
for app in "${APPS[@]}"; do
  node -r dotenv/config "dist/apps/${app}/main.js" > "${ROOT_DIR}/.tmp-integration/logs/${app}.log" 2>&1 &
  PIDS+=("$!")
done
sleep 15

# jest integration: keep jest's exit status through the tail pipeline
set +e
./node_modules/.bin/jest --config jest.integration.config.js --maxWorkers=1 2>&1 | tail -20
JEST_STATUS="${PIPESTATUS[0]}"
set -e

# cleanup
if [[ ${#PIDS[@]} -gt 0 ]]; then
  for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done
fi
docker compose -f /tmp/integration-infra.yml down -v >/dev/null 2>&1 || true
if [[ "$CREATED_ENV" == "true" ]]; then
  rm -f "$ENV_FILE"
fi
rm -f /tmp/integration-infra.yml 2>/dev/null || true

if [[ "$JEST_STATUS" -ne 0 ]]; then
  echo "INTEGRATION_FAILED jest_exit=${JEST_STATUS}"
  exit "$JEST_STATUS"
fi
echo "INTEGRATION_RUN_DONE"
