/*
  Warnings:

  - You are about to drop the column `autoAcceptConnection` on the `connections` table. All the data in the column will be lost.
  - You are about to drop the column `orgDid` on the `connections` table. All the data in the column will be lost.
  - You are about to drop the column `outOfBandId` on the `connections` table. All the data in the column will be lost.
  - You are about to drop the column `theirLabel` on the `connections` table. All the data in the column will be lost.
  - You are about to drop the column `credentialAttributes` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `protocolVersion` on the `credentials` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_orgId_fkey";

-- DropForeignKey
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_orgId_fkey";

-- DropForeignKey
ALTER TABLE "presentations" DROP CONSTRAINT "presentations_orgId_fkey";

-- AlterTable
ALTER TABLE "connections" DROP COLUMN "autoAcceptConnection",
DROP COLUMN "orgDid",
DROP COLUMN "outOfBandId",
DROP COLUMN "theirLabel",
ALTER COLUMN "orgId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "credentials" DROP COLUMN "credentialAttributes",
DROP COLUMN "protocolVersion",
ADD COLUMN     "credentialExchangeId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "state" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "orgId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ledgers" ADD COLUMN     "networkUrl" VARCHAR;

-- AlterTable
ALTER TABLE "presentations" ALTER COLUMN "orgId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
