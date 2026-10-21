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

# shellcheck source=scripts/lib-integration.sh
source "${ROOT_DIR}/scripts/lib-integration.sh"

# Optional integration env file (the same one integration-run.sh uses), loaded
# early so POSTGRES_* overrides apply to this standalone flow. Missing file or
# variables are fine — the defaults below are preserved.
# Caller-provided POSTGRES_* values win over the file, so explicit environment
# overrides are not silently replaced.
ENV_FILE="${ROOT_DIR}/.env.integration"
if [[ -f "$ENV_FILE" ]]; then
  _caller_pg=""
  for _v in POSTGRES_HOST POSTGRES_PORT POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD; do
    if [[ -n "${!_v:-}" ]]; then
      _caller_pg="${_caller_pg}${_v}=${!_v}"$'\n'
    fi
  done
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  # Re-apply only the variables the caller explicitly set (bash 3.2 has no
  # associative arrays; this newline-delimited form keeps it portable).
  while IFS= read -r _line; do
    [[ -n "$_line" ]] || continue
    export "${_line%%=*}=${_line#*=}"
  done <<< "$_caller_pg"
  unset _caller_pg _line _v
fi

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
# Fail before any PostgreSQL connection if the throwaway Compose infra cannot
# start — otherwise localhost:5432 may silently reach an unrelated server
# (e.g. a different local Postgres) and migrate would modify it. Only an
# explicitly configured external Postgres (POSTGRES_HOST) tolerates this.
if ! docker compose -f /tmp/integration-infra.yml up -d >/dev/null 2>&1; then
  if [[ -n "${POSTGRES_HOST:-}" ]]; then
    echo "WARN: compose infra failed to start; using explicitly configured external Postgres at ${POSTGRES_HOST}"
    # The external-Postgres path still needs NATS and Redis for the harness;
    # if they are not reachable, fail instead of reporting SETUP_DONE.
    services_ok=true
    if ! docker compose -f /tmp/integration-infra.yml ps --status running --services 2>/dev/null | grep -qx 'redis'; then
      echo "ERROR: redis is not running for the external-Postgres flow"
      services_ok=false
    fi
    if ! docker compose -f /tmp/integration-infra.yml ps --status running --services 2>/dev/null | grep -qx 'nats'; then
      echo "ERROR: nats is not running for the external-Postgres flow"
      services_ok=false
    fi
    if [[ "$services_ok" != "true" ]]; then
      docker compose -f /tmp/integration-infra.yml down >/dev/null 2>&1 || true
      rm -f /tmp/integration-infra.yml
      exit 1
    fi
  else
    echo "ERROR: could not start integration infra (is a host port already in use? e.g. 5432/6379/4222)"
    # compose may have partially started other services — tear them down
    docker compose -f /tmp/integration-infra.yml down >/dev/null 2>&1 || true
    rm -f /tmp/integration-infra.yml
    exit 1
  fi
fi
sleep 10

# Ensure integration DB exists if a local Postgres is used (and we point to it)
# Try to create DB if needed (ignore errors if using external PG)
PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-postgres}"
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
PGDATABASE="${POSTGRES_DB:-credebl_integration}"
export PGPASSWORD

# create db if not exists using psql if available
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -tc "SELECT 1 FROM pg_database WHERE datname='${PGDATABASE}'" | grep -q 1 2>/dev/null || \
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -c "CREATE DATABASE ${PGDATABASE};" 2>/dev/null || true

# Construct DB URLs for Prisma from the integration connection components so
# migrate deploy always targets the throwaway Compose database above.
# Credentials are percent-encoded so reserved characters cannot corrupt the URL.
DB_URL="$(integration_db_url)"
export DATABASE_URL="$DB_URL"
export POOL_DATABASE_URL="$DB_URL"

# validate: both must point at the intended temp database, or fail before migrating
for url_var in DATABASE_URL POOL_DATABASE_URL; do
  # shellcheck disable=SC2086,SC2298
  url="${!url_var}"
  if [[ "$url" != *"@${PGHOST}:${PGPORT}/${PGDATABASE}"* ]]; then
    echo "ERROR: ${url_var} does not target postgres://${PGHOST}:${PGPORT}/${PGDATABASE} (got: ${url})"
    exit 1
  fi
done

# migrate
./node_modules/.bin/prisma migrate deploy --schema libs/prisma-service/prisma/schema.prisma 2>&1 | tail -1

echo "SETUP_DONE"
