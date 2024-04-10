/*
  Warnings:

  - You are about to drop the column `registerDIDEndpoint` on the `ledgers` table. All the data in the column will be lost.
  - You are about to drop the column `registerDIDPayload` on the `ledgers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ledgers" DROP COLUMN "registerDIDEndpoint",
DROP COLUMN "registerDIDPayload",
ADD COLUMN     "registeredDIDEndpoint" VARCHAR,
ADD COLUMN     "registeredDIDPayload" JSONB;
