/*
  Warnings:

  - You are about to drop the column `url` on the `shortening_url` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referenceId]` on the table `shortening_url` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "shortening_url" DROP COLUMN "url",
ADD COLUMN     "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(6),
ADD COLUMN     "invitationPayload" JSONB,
ADD COLUMN     "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "type" SET DATA TYPE VARCHAR;

-- CreateIndex
CREATE UNIQUE INDEX "shortening_url_referenceId_key" ON "shortening_url"("referenceId");
