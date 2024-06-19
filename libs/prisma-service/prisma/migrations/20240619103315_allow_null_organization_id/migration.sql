-- DropForeignKey
ALTER TABLE "credential_definition" DROP CONSTRAINT "credential_definition_orgId_fkey";

-- DropForeignKey
ALTER TABLE "schema" DROP CONSTRAINT "schema_orgId_fkey";

-- AlterTable
ALTER TABLE "schema" ALTER COLUMN "orgId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "schema" ADD CONSTRAINT "schema_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_definition" ADD CONSTRAINT "credential_definition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
