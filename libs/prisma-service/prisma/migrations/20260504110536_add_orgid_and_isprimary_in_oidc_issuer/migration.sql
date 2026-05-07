-- AlterTable
ALTER TABLE "oidc_issuer" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "oidc_issuer" ADD COLUMN IF NOT EXISTS "orgId" UUID;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oidc_issuer_orgId_fkey') THEN
        ALTER TABLE "oidc_issuer" ADD CONSTRAINT "oidc_issuer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
