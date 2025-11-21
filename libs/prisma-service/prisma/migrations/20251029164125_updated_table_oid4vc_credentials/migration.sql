/*
  Warnings:

  - You are about to drop the column `offerId` on the `oid4vc_credentials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[issuanceSessionId]` on the table `oid4vc_credentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `issuanceSessionId` to the `oid4vc_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "oid4vc_credentials_offerId_key";

-- AlterTable
ALTER TABLE "oid4vc_credentials" DROP COLUMN "offerId",
ADD COLUMN     "credentialConfigurationIds" TEXT[],
ADD COLUMN     "issuanceSessionId" TEXT NOT NULL,
ADD COLUMN     "issuedCredentials" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "oid4vc_credentials_issuanceSessionId_key" ON "oid4vc_credentials"("issuanceSessionId");

-- CreateIndex
CREATE INDEX "oid4vc_credentials_credentialConfigurationIds_idx" ON "oid4vc_credentials" USING GIN ("credentialConfigurationIds");
