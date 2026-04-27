-- DropForeignKey
ALTER TABLE "issued_oid4vc_credentials" DROP CONSTRAINT "issued_oid4vc_credentials_orgId_fkey";

-- DropForeignKey
ALTER TABLE "oid4vc_credentials" DROP CONSTRAINT "oid4vc_credentials_orgId_fkey";

-- AlterTable
ALTER TABLE "oid4vc_credentials" ALTER COLUMN "orgId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "oidc_issuer" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orgId" UUID;

-- AddForeignKey
ALTER TABLE "oidc_issuer" ADD CONSTRAINT "oidc_issuer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oid4vc_credentials" ADD CONSTRAINT "oid4vc_credentials_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_oid4vc_credentials" ADD CONSTRAINT "issued_oid4vc_credentials_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
