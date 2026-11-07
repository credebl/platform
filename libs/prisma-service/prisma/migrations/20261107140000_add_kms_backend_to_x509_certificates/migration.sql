-- AlterTable
ALTER TABLE "x509_certificates" ADD COLUMN     "kmsBackend" TEXT;

-- Backfill certificates created before the KMS backend was recorded. OpenBao namespaces its key ids with "ob_",
-- every other key was stored in Askar (the platform only creates Ed25519 and P-256 keys, which Askar supports).
UPDATE "x509_certificates"
SET "kmsBackend" = CASE WHEN "keyId" LIKE 'ob\_%' ESCAPE '\' THEN 'openbao' ELSE 'askar' END
WHERE "kmsBackend" IS NULL;
