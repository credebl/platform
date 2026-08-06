#!/usr/bin/env bash
#
# Bootstrap OpenBao (docker-compose.openbao.yml) for the CREDEBL platform demo.
#
# Provisions, idempotently:
#   - OpenBao initialization + unseal (if not already initialized)
#   - KV v2 secrets engine at secret/
#   - AppRole auth method
#   - a "credebl" AppRole role + policy scoped to the credebl_* secret paths
#   - the platform's secret data, sourced from the matching environment variables
#
# Usage:
#   ./openbao-init.sh
#
# On the first run the script prints the unseal key, root token, role_id and
# secret_id. Copy BAO_ROLE_ID and BAO_SECRET_ID into .env.demo.
# On later runs it is idempotent: it re-prints role_id and re-uses an existing
# secret_id instead of generating a new one.
#
# Optional inputs (read from the environment):
#   BAO_UNSEAL_KEY   - unseal key from a previous run (needed if already
#                      initialized but sealed)
#   BAO_ROOT_TOKEN   - root token from a previous run (avoids re-printing)
#   CONTAINER_NAME   - docker container name (default: openbao)
#   RESEND_API_KEY, SENDGRID_API_KEY, SMTP_HOST/PORT/USER/PASS,
#   AWS_*             - secret values to store; only the ones that are set
#                       (non-empty) are written
#
# NOTE: for demo only. The unseal key and root token are secrets; do not commit
# them to the repository.

set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-openbao}"
BAO_ADDR_IN_CONTAINER="${BAO_ADDR_IN_CONTAINER:-http://127.0.0.1:8200}"

run_bao() {
  docker exec -e BAO_TOKEN="${BAO_TOKEN:-}" "$CONTAINER_NAME" bao "$@"
}

echo_step() {
  printf '\n==> %s\n' "$1"
}

echo "Connecting to OpenBao in container '${CONTAINER_NAME}' (${BAO_ADDR_IN_CONTAINER})..."

status="$(docker exec "$CONTAINER_NAME" bao status 2>&1 || true)"
initialized="$(grep -E '^Initialized' <<<"$status" | awk '{print $2}')"
sealed="$(grep -E '^Sealed' <<<"$status" | awk '{print $2}')"

if [[ "$initialized" != "true" ]]; then
  echo_step "OpenBao is not initialized. Running 'bao operator init' (1 unseal key)..."
  init_out="$(docker exec "$CONTAINER_NAME" bao operator init -key-shares=1 -key-threshold=1)"
  BAO_UNSEAL_KEY="${BAO_UNSEAL_KEY:-$(grep 'Unseal Key 1:' <<<"$init_out" | awk '{print $NF}')}"
  BAO_ROOT_TOKEN="${BAO_ROOT_TOKEN:-$(grep 'Initial Root Token:' <<<"$init_out" | awk '{print $NF}')}"
else
  BAO_UNSEAL_KEY="${BAO_UNSEAL_KEY:-}"
  BAO_ROOT_TOKEN="${BAO_ROOT_TOKEN:-}"
fi

if [[ "$sealed" == "true" ]]; then
  if [[ -z "$BAO_UNSEAL_KEY" ]]; then
    echo "ERROR: OpenBao is sealed. Re-run with BAO_UNSEAL_KEY=<key> (from the first run)." >&2
    exit 1
  fi
  echo_step "Unsealing OpenBao..."
  docker exec "$CONTAINER_NAME" bao operator unseal "$BAO_UNSEAL_KEY" >/dev/null
fi

if [[ -z "$BAO_ROOT_TOKEN" ]]; then
  echo "ERROR: no root token available. Re-run with BAO_ROOT_TOKEN=<token> (from the first run)." >&2
  exit 1
fi
BAO_TOKEN="$BAO_ROOT_TOKEN"

if ! run_bao secrets list 2>/dev/null | grep -q '^secret/'; then
  echo_step "Enabling KV v2 secrets engine at secret/..."
  run_bao secrets enable -path=secret kv-v2
fi

if ! run_bao auth list 2>/dev/null | grep -q '^approle/'; then
  echo_step "Enabling AppRole auth method..."
  run_bao auth enable approle
fi

if ! run_bao policy list 2>/dev/null | grep -qx 'credebl-secrets'; then
  echo_step "Writing 'credebl-secrets' policy..."
  docker exec -i -e BAO_TOKEN="$BAO_TOKEN" "$CONTAINER_NAME" bao policy write credebl-secrets - <<'POLICY'
path "secret/data/credebl_*" {
  capabilities = ["read"]
}
path "secret/metadata/credebl_*" {
  capabilities = ["read", "list"]
}
POLICY
fi

role_exists="false"
if run_bao read auth/approle/role/credebl >/dev/null 2>&1; then
  role_exists="true"
fi

if [[ "$role_exists" == "false" ]]; then
  echo_step "Creating AppRole role 'credebl' (non-expiring secret_id, read-only policy)..."
  run_bao write auth/approle/role/credebl \
    token_policies=credebl-secrets \
    secret_id_ttl=0 \
    token_ttl=30m \
    token_max_ttl=1h
fi

role_id="$(run_bao read -field=role_id auth/approle/role/credebl/role-id)"

if [[ "$role_exists" == "false" ]]; then
  echo_step "Generating secret_id for the 'credebl' role..."
  secret_id="$(run_bao write -f -field=secret_id auth/approle/role/credebl/secret-id)"
else
  secret_id="${BAO_SECRET_ID:-}"
fi

echo_step "Storing platform secrets..."

kv_put() {
  local path="$1"
  shift
  if [[ "$#" -gt 0 ]]; then
    docker exec -e BAO_TOKEN="$BAO_TOKEN" "$CONTAINER_NAME" bao kv put "$path" "$@" >/dev/null
    echo "  wrote ${path}"
  else
    echo "  skipped ${path} (no matching environment variables set)"
  fi
}

kv_put secret/credebl_resend_api_key \
  $( [[ -n "${RESEND_API_KEY:-}" ]] && printf 'RESEND_API_KEY=%s' "$RESEND_API_KEY" )

kv_put secret/credebl_sendgrid_api_key \
  $( [[ -n "${SENDGRID_API_KEY:-}" ]] && printf 'SENDGRID_API_KEY=%s' "$SENDGRID_API_KEY" )

kv_put secret/credebl_smtp_config \
  $( [[ -n "${SMTP_HOST:-}" ]] && printf 'SMTP_HOST=%s' "$SMTP_HOST" ) \
  $( [[ -n "${SMTP_PORT:-}" ]] && printf 'SMTP_PORT=%s' "$SMTP_PORT" ) \
  $( [[ -n "${SMTP_USER:-}" ]] && printf 'SMTP_USER=%s' "$SMTP_USER" ) \
  $( [[ -n "${SMTP_PASS:-}" ]] && printf 'SMTP_PASS=%s' "$SMTP_PASS" )

kv_put secret/credebl_aws_keys \
  $( [[ -n "${AWS_ACCESS_KEY:-}" ]] && printf 'AWS_ACCESS_KEY=%s' "$AWS_ACCESS_KEY" ) \
  $( [[ -n "${AWS_SECRET_KEY:-}" ]] && printf 'AWS_SECRET_KEY=%s' "$AWS_SECRET_KEY" ) \
  $( [[ -n "${AWS_PUBLIC_ACCESS_KEY:-}" ]] && printf 'AWS_PUBLIC_ACCESS_KEY=%s' "$AWS_PUBLIC_ACCESS_KEY" ) \
  $( [[ -n "${AWS_PUBLIC_SECRET_KEY:-}" ]] && printf 'AWS_PUBLIC_SECRET_KEY=%s' "$AWS_PUBLIC_SECRET_KEY" ) \
  $( [[ -n "${AWS_S3_STOREOBJECT_ACCESS_KEY:-}" ]] && printf 'AWS_S3_STOREOBJECT_ACCESS_KEY=%s' "$AWS_S3_STOREOBJECT_ACCESS_KEY" ) \
  $( [[ -n "${AWS_S3_STOREOBJECT_SECRET_KEY:-}" ]] && printf 'AWS_S3_STOREOBJECT_SECRET_KEY=%s' "$AWS_S3_STOREOBJECT_SECRET_KEY" )

echo_step "Done. Add the following to .env.demo:"
cat <<EOF
BAO_URL=${BAO_ADDR_IN_CONTAINER}
BAO_SECRET_PATH=secret/data/credebl_resend_api_key
BAO_ROLE_ID=${role_id}
BAO_SECRET_ID=${secret_id}

Keep these safe (not needed for .env.demo, but required to unseal/re-login later):
BAO_UNSEAL_KEY=${BAO_UNSEAL_KEY}
BAO_ROOT_TOKEN=${BAO_ROOT_TOKEN}
EOF
