-- AlterTable
ALTER TABLE "issued_oid4vc_credentials" ADD COLUMN IF NOT EXISTS "orgId" UUID;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'issued_oid4vc_credentials_orgId_fkey') THEN
        ALTER TABLE "issued_oid4vc_credentials" ADD CONSTRAINT "issued_oid4vc_credentials_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'issued_oid4vc_credentials_orgId_issuanceSessionId_idx') THEN
        CREATE INDEX "issued_oid4vc_credentials_orgId_issuanceSessionId_idx" ON "issued_oid4vc_credentials"("orgId", "issuanceSessionId");
    END IF;
END $$;
