-- AlterTable
ALTER TABLE "file_data" ADD COLUMN     "credDefId" TEXT,
ADD COLUMN     "schemaId" TEXT,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT false;
