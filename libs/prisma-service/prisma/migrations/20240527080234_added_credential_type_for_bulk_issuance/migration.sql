-- AlterTable
ALTER TABLE "file_data" ADD COLUMN     "credential_type" TEXT;

-- AlterTable
ALTER TABLE "file_upload" ADD COLUMN     "credential_type" TEXT;
