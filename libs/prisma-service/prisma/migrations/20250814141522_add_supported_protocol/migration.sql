-- Create enum type
CREATE TYPE "CredentialExchangeProtocol" AS ENUM ('OIDC', 'DIDCOMM');

-- Add column
ALTER TABLE "organisation"
ADD COLUMN "supported_protocol" "CredentialExchangeProtocol"[];

-- Set default for new rows
ALTER TABLE "organisation"
ALTER COLUMN "supported_protocol"
SET DEFAULT ARRAY['DIDCOMM']::"CredentialExchangeProtocol"[];

-- Clean existing duplicates before constraint
-- UPDATE "organisation"
-- SET "supported_protocol" = ARRAY(
--     SELECT DISTINCT unnest("supported_protocol")
-- )
-- WHERE "supported_protocol" IS NOT NULL;

-- Backfill missing/empty with DIDCOMM
UPDATE "organisation"
SET "supported_protocol" = ARRAY['DIDCOMM']::"CredentialExchangeProtocol"[]
WHERE "supported_protocol" IS NULL OR cardinality("supported_protocol") = 0;

-- Add no-duplicates constraint
-- ALTER TABLE "organisation"
-- ADD CONSTRAINT supported_protocol_unique
-- CHECK (
--     cardinality(supported_protocol) = cardinality(
--         ARRAY(SELECT DISTINCT unnest(supported_protocol))
--     )
-- );
-- trigger function to check unique values
CREATE OR REPLACE FUNCTION check_unique_protocols()
RETURNS trigger AS $$
BEGIN
    IF (SELECT COUNT(*) FROM unnest(NEW.supported_protocol) v
        GROUP BY v HAVING COUNT(*) > 1 LIMIT 1) IS NOT NULL THEN
        RAISE EXCEPTION 'supported_protocol contains duplicates';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_unique_protocols
BEFORE INSERT OR UPDATE ON organisation
FOR EACH ROW EXECUTE FUNCTION check_unique_protocols();



-- contraints, triggers and migrations for ledger table
ALTER TABLE "ledgers"
ADD COLUMN "supported_protocol" "CredentialExchangeProtocol"[];

-- Set default for new rows
ALTER TABLE "ledgers"
ALTER COLUMN "supported_protocol"
SET DEFAULT ARRAY['DIDCOMM']::"CredentialExchangeProtocol"[];

-- Clean existing duplicates before constraint
-- UPDATE "ledgers"
-- SET "supported_protocol" = ARRAY(
--     SELECT DISTINCT unnest("supported_protocol")
-- )
-- WHERE "supported_protocol" IS NOT NULL;

-- Backfill missing/empty with DIDCOMM
UPDATE "ledgers"
SET "supported_protocol" = ARRAY['DIDCOMM']::"CredentialExchangeProtocol"[]
WHERE "supported_protocol" IS NULL OR cardinality("supported_protocol") = 0;

-- Add no-duplicates constraint
-- ALTER TABLE "ledgers"
-- ADD CONSTRAINT supported_protocol_unique
-- CHECK (
--     cardinality(supported_protocol) = cardinality(
--         ARRAY(SELECT DISTINCT unnest(supported_protocol))
--     )
-- );
-- trigger function to check unique values
CREATE OR REPLACE FUNCTION check_unique_protocols()
RETURNS trigger AS $$
BEGIN
    IF (SELECT COUNT(*) FROM unnest(NEW.supported_protocol) v
        GROUP BY v HAVING COUNT(*) > 1 LIMIT 1) IS NOT NULL THEN
        RAISE EXCEPTION 'supported_protocol contains duplicates';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_unique_protocols
BEFORE INSERT OR UPDATE ON ledgers
FOR EACH ROW EXECUTE FUNCTION check_unique_protocols();