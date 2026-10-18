#!/bin/bash
set -euo pipefail

CI="${CI:-false}"
RUN_INTEGRATION="${RUN_INTEGRATION:-false}"

if [[ "$CI" == "true" && "$RUN_INTEGRATION" != "true" ]]; then
  echo "CI=true and RUN_INTEGRATION!=true; integration setup skipped by default"
  exit 0
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "${ROOT_DIR}/.tmp-integration/logs"

# start infra (minimal)
cat > /tmp/integration-infra.yml << 'EOF'
services:
  nats:
    image: nats
    ports: ["4222:4222","8222:8222"]
  redis:
    image: redis:8.10-alpine
    ports: ["6379:6379"]
  postgres:
    image: postgres:16
    environment: {POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres, POSTGRES_DB: credebl_integration}
    ports: ["5432:5432"]
EOF
docker compose -f /tmp/integration-infra.yml up -d >/dev/null 2>&1 || true
sleep 10

# migrate
./node_modules/.bin/prisma migrate deploy --schema libs/prisma-service/prisma/schema.prisma 2>&1 | tail -1

echo "SETUP_DONE"
