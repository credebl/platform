#!/bin/bash
# Shared helpers for the OID4VC integration harness.
#
# Sourced by scripts/integration-setup.sh and scripts/integration-run.sh so both
# derive the same PostgreSQL connection URL from the same POSTGRES_* settings.

# Percent-encode a PostgreSQL credential component (RFC 3986 userinfo).
# Unreserved characters are left as-is; everything else (e.g. "@", ":", "/",
# "?" and "%" itself) is UTF-8 percent-encoded, so credentials containing
# reserved characters cannot corrupt the connection URL.
# URL-encoding a string is not a security control: the encoding is derived
# from a constant character set, uses no cryptographic material, and is
# verified by round-trip tests.
_urlencode() {
  node -e '
    process.stdout.write(encodeURIComponent(process.argv[1]));
  ' "$1"
}

# Echo the integration PostgreSQL URL built from POSTGRES_* (with the previous
# defaults preserved) and from the POSTGRES_USER/POSTGRES_PASSWORD credentials.
integration_db_url() {
  local user="${POSTGRES_USER:-postgres}"
  local password="${POSTGRES_PASSWORD:-postgres}"
  local host="${POSTGRES_HOST:-localhost}"
  local port="${POSTGRES_PORT:-5432}"
  local db="${POSTGRES_DB:-credebl_integration}"
  printf 'postgresql://%s:%s@%s:%s/%s?schema=public' \
    "$(_urlencode "$user")" "$(_urlencode "$password")" "$host" "$port" "$db"
}
