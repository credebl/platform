-- AlterTable
ALTER TABLE "oidc_issuer" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orgId" UUID;

-- AddForeignKey
ALTER TABLE "oidc_issuer" ADD CONSTRAINT "oidc_issuer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
