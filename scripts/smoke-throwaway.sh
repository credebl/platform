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

# start infra
INFRA_YML="${OUT_DIR}/infra.yml"
cat > "$INFRA_YML" << 'EOF'
services:
  nats:
    image: nats
    container_name: smoke-nats
    ports: ["4222:4222","8222:8222"]
  redis:
    image: redis:8.10-alpine
    container_name: smoke-redis
    ports: ["6379:6379"]
  postgres:
    image: postgres:16
    container_name: smoke-postgres
    environment: {POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres, POSTGRES_DB: credebl}
    ports: ["5432:5432"]
EOF
docker compose -f "$INFRA_YML" up -d >/dev/null 2>&1 || true
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

# env
ENV_FILE="${ROOT_DIR}/.env.smoke"
sed -e 's/your-ip/localhost/g' -e 's|^REDIS_HOST=.*|REDIS_HOST=localhost|' -e 's|^REDIS_PORT=.*|REDIS_PORT=6379|' -e 's|^WALLET_STORAGE_HOST=.*|WALLET_STORAGE_HOST=localhost|' -e 's|^WALLET_STORAGE_PORT=.*|WALLET_STORAGE_PORT=5432|' -e 's|postgresql://postgres:postgres@localhost:5432/credebl|postgresql://postgres:postgres@localhost:5432/credebl|g' -e 's|^NATS_URL=.*|NATS_URL=nats://localhost:4222|' -e 's|^ENABLE_BAO=.*|ENABLE_BAO=false|' "${ROOT_DIR}/.env.demo" > "$ENV_FILE" 2>/dev/null || true

export $(grep -v '^#' "$ENV_FILE" | xargs) 2>/dev/null || true

# start
PIDS=()
for app in "${APPS[@]}"; do
  node -r dotenv/config "dist/apps/${app}/main.js" > "$LOG_DIR/boot-${app}.log" 2>&1 &
  PIDS+=("$!")
done
sleep 10

# cleanup
for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done
docker compose -f "$INFRA_YML" down -v >/dev/null 2>&1 || true
rm -rf "$OUT_DIR" "$ENV_FILE" 2>/dev/null || true
echo "SMOKE_OK subset=$SUBSET apps=${#APPS[@]}"
