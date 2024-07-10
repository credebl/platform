/*
  Warnings:

  - A unique constraint covering the columns `[schemaLedgerId]` on the table `schema` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schemaIdentifier` to the `file_upload` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "file_upload" ADD COLUMN     "schemaIdentifier" VARCHAR NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "schema_schemaLedgerId_key" ON "schema"("schemaLedgerId");

-- AddForeignKey
ALTER TABLE "file_upload" ADD CONSTRAINT "file_upload_schemaIdentifier_fkey" FOREIGN KEY ("schemaIdentifier") REFERENCES "schema"("schemaLedgerId") ON DELETE RESTRICT ON UPDATE CASCADE;