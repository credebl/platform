#!/bin/bash
set -euo pipefail

CI="${CI:-false}"
RUN_INTEGRATION="${RUN_INTEGRATION:-false}"
SUBSET="${SUBSET:-oid4vc}" # oid4vc|core|all

if [[ "$CI" == "true" && "$RUN_INTEGRATION" != "true" ]]; then
  echo "CI=true and RUN_INTEGRATION!=true; smoke-throwaway skipped by default"
  exit 0
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/.tmp-smoke"
LOG_DIR="${OUT_DIR}/logs"
mkdir -p "$LOG_DIR"

# start infra (host ports bound to loopback only; container ports unchanged;
# override SMOKE_*_PORT when the defaults are already in use locally)
SMOKE_NATS_PORT="${SMOKE_NATS_PORT:-4222}"
SMOKE_REDIS_PORT="${SMOKE_REDIS_PORT:-6379}"
SMOKE_PG_PORT="${SMOKE_PG_PORT:-5432}"
INFRA_YML="${OUT_DIR}/infra.yml"
cat > "$INFRA_YML" << EOF
services:
  nats:
    image: nats
    container_name: smoke-nats
    ports: ["127.0.0.1:${SMOKE_NATS_PORT}:4222","127.0.0.1:8222:8222"]
  redis:
    image: redis:8.10-alpine
    container_name: smoke-redis
    ports: ["127.0.0.1:${SMOKE_REDIS_PORT}:6379"]
  postgres:
    image: postgres:16
    container_name: smoke-postgres
    environment: {POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres, POSTGRES_DB: credebl}
    ports: ["127.0.0.1:${SMOKE_PG_PORT}:5432"]
EOF

# ensure infra is torn down on every exit path (startup failure, build
# failure, jest failure or success); runs exactly once — the success path
# disarms the trap after running cleanup itself
cleanup() {
  docker compose -f "$INFRA_YML" down -v >/dev/null 2>&1 || true
}
ENV_FILE="${ROOT_DIR}/.env.smoke"
PIDS=()
trap cleanup EXIT

if ! docker compose -f "$INFRA_YML" up -d; then
  echo "SMOKE_FAIL could not start infra (is a required host port already in use? e.g. 5432/6379/4222)"
  exit 1
fi
sleep 5

# build subset
case "$SUBSET" in
  oid4vc)
    APPS=(oid4vc-issuance oid4vc-verification api-gateway)
    ;;
  core)
    APPS=(agent-provisioning agent-service api-gateway)
    ;;
  all)
    APPS=(agent-provisioning agent-service api-gateway cloud-wallet connection ecosystem geo-location issuance ledger notification oid4vc-issuance oid4vc-verification organization user utility verification webhook x509)
    ;;
  *)
    APPS=(oid4vc-issuance oid4vc-verification api-gateway)
    ;;
esac

# build
for app in "${APPS[@]}"; do
  npx --yes nest build "$app" > "$LOG_DIR/build-${app}.log" 2>&1 || { echo "BUILD_FAIL $app"; exit 1; }
done

# env (host ports follow the SMOKE_*_PORT overrides above)
sed -e 's/your-ip/localhost/g' \
  -e "s|^REDIS_HOST=.*|REDIS_HOST=localhost|" \
  -e "s|^REDIS_PORT=.*|REDIS_PORT=${SMOKE_REDIS_PORT}|" \
  -e "s|^WALLET_STORAGE_HOST=.*|WALLET_STORAGE_HOST=localhost|" \
  -e "s|^WALLET_STORAGE_PORT=.*|WALLET_STORAGE_PORT=${SMOKE_PG_PORT}|" \
  -e "s|:5432/credebl|:${SMOKE_PG_PORT}/credebl|g" \
  -e "s|^NATS_URL=.*|NATS_URL=nats://localhost:${SMOKE_NATS_PORT}|" \
  -e 's|^ENABLE_BAO=.*|ENABLE_BAO=false|' \
  "${ROOT_DIR}/.env.demo" > "$ENV_FILE" 2>/dev/null || true

# dotenv loads the values for the app preloads; avoids grep/xargs word splitting
export DOTENV_CONFIG_PATH="$ENV_FILE"

# start
for app in "${APPS[@]}"; do
  node -r dotenv/config "dist/apps/${app}/main.js" > "$LOG_DIR/boot-${app}.log" 2>&1 &
  PIDS+=("$!")
done

# wait for readiness: all apps alive and logging a startup marker (max 30s)
deadline=$((SECONDS + 30))
ready=false
while (( SECONDS < deadline )); do
  ready=true
  for i in "${!APPS[@]}"; do
    pid="${PIDS[$i]}"
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "SMOKE_FAIL app exited early: ${APPS[$i]}"
      ready=false
      break
    fi
    if ! grep -Eqi 'Nest application successfully started|listening' "$LOG_DIR/boot-${APPS[$i]}.log" 2>/dev/null; then
      ready=false
      break
    fi
  done
  if [[ "$ready" == "true" ]]; then
    break
  fi
  sleep 1
done

if [[ "$ready" != "true" ]]; then
  echo "SMOKE_FAIL startup checks did not pass within 30s (subset=$SUBSET)"
  for i in "${!APPS[@]}"; do
    echo "--- boot log tail: ${APPS[$i]} ---"
    tail -40 "$LOG_DIR/boot-${APPS[$i]}.log" 2>/dev/null || true
  done
  echo "Full logs kept in ${LOG_DIR}"
  exit 1
fi

# infra still running after the wait?
for cid in $(docker compose -f "$INFRA_YML" ps -q 2>/dev/null); do
  if [[ "$(docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null || echo false)" != "true" ]]; then
    echo "SMOKE_FAIL infra container not running: $cid"
    exit 1
  fi
done

# stop apps, tear down infra, then disarm the trap so cleanup runs exactly once
for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done
cleanup
trap - EXIT

rm -rf "$OUT_DIR" "$ENV_FILE" 2>/dev/null || true
echo "SMOKE_OK subset=$SUBSET apps=${#APPS[@]}"
