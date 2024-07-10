-- DropForeignKey
ALTER TABLE "file_upload" DROP CONSTRAINT "file_upload_schemaIdentifier_fkey";

-- AlterTable
ALTER TABLE "file_upload" ALTER COLUMN "schemaIdentifier" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "file_upload" ADD CONSTRAINT "file_upload_schemaIdentifier_fkey" FOREIGN KEY ("schemaIdentifier") REFERENCES "schema"("schemaLedgerId") ON DELETE SET NULL ON UPDATE CASCADE;
