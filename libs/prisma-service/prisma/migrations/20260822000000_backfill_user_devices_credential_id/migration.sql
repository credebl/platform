-- Backfill user_devices.credentialId from the credential embedded in the devices JSON.
--
-- Devices registered before credentialId was persisted at registration time only carried
-- the value inside devices->>'credentialID'. Ownership checks and authentication lookups
-- query the column, so those legacy rows are unreachable for rename/delete and passkey login.
--
-- Legacy JSON values were stored padding-stripped but not URL-safe encoded. They are
-- normalized to unpadded base64url (strip '=' padding, '+' -> '-', '/' -> '_') to match
-- what FidoService.normalizeCredentialId produces before every lookup.
--
-- The UPDATE below is a single statement, so it is atomic: if two devices collide on the
-- same normalized credential ID (the column has a unique constraint), the exception
-- handler replaces the constraint error with an actionable message and nothing is written.

BEGIN;

DO $$
BEGIN
  WITH normalized AS (
    SELECT
      "id",
      translate(regexp_replace("devices"->>'credentialID', '=+$', ''), '+/', '-_') AS normalized_id
    FROM "user_devices"
    WHERE "devices"->>'credentialID' IS NOT NULL
  )
  UPDATE "user_devices" ud
  SET
    "credentialId" = n.normalized_id,
    "devices" = jsonb_set(ud."devices", '{credentialID}', to_jsonb(n.normalized_id)),
    "lastChangedDateTime" = now()
  FROM normalized n
  WHERE ud."id" = n."id";

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Cannot backfill user_devices.credentialId: devices collide on the same credential ID after normalization; resolve manually first';
END $$;

COMMIT;
