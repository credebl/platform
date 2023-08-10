/*
  Warnings:

  - You are about to drop the column `status` on the `organisation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orgSlug]` on the table `organisation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organisation" DROP COLUMN "status",
ADD COLUMN     "orgSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organisation_orgSlug_key" ON "organisation"("orgSlug");
