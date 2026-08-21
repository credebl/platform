-- Backfill user_devices.credentialId from the credential embedded in the devices JSON.
--
-- Devices registered before credentialId was persisted at registration time only carried
-- the value inside devices->>'credentialID'. Ownership checks and authentication lookups
-- query the column, so those legacy rows are unreachable for rename/delete and passkey login.
--
-- Legacy JSON values were stored padding-stripped but not URL-safe encoded. They are
-- normalized to unpadded base64url (strip '=' padding, '+' -> '-', '/' -> '_') to match
-- what FidoService.normalizeCredentialId produces before every lookup.

BEGIN;

-- The credentialId column has a unique constraint. Fail with a clear message instead of
-- letting the UPDATE hit a constraint violation mid-migration.
DO $$
DECLARE
  collision_count int;
BEGIN
  SELECT COUNT(*)
  INTO collision_count
  FROM (
    SELECT translate(regexp_replace("devices"->>'credentialID', '=+$', ''), '+/', '-_') AS normalized_id
    FROM "user_devices"
    WHERE "devices" ? 'credentialID'
      AND "devices"->>'credentialID' IS NOT NULL
    GROUP BY 1
    HAVING COUNT(*) > 1
  ) collisions;

  IF collision_count > 0 THEN
    RAISE EXCEPTION 'Cannot backfill user_devices.credentialId: % device(s) collide on the same credential ID after normalization; resolve manually first', collision_count;
  END IF;
END $$;

WITH normalized AS (
  SELECT
    "id",
    translate(regexp_replace("devices"->>'credentialID', '=+$', ''), '+/', '-_') AS normalized_id
  FROM "user_devices"
  WHERE "devices" ? 'credentialID'
    AND "devices"->>'credentialID' IS NOT NULL
)
UPDATE "user_devices" ud
SET
  "credentialId" = n.normalized_id,
  "devices" = jsonb_set(ud."devices", '{credentialID}', to_jsonb(n.normalized_id)),
  "lastChangedDateTime" = now()
FROM normalized n
WHERE ud."id" = n."id"
  AND (
    ud."credentialId" IS DISTINCT FROM n.normalized_id
    OR ud."devices"->>'credentialID' IS DISTINCT FROM n.normalized_id
  );

COMMIT;
