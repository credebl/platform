/*
  Warnings:

  - You are about to drop the column `registerDIDEndpoint` on the `ledgers` table. All the data in the column will be lost.
  - You are about to drop the column `registerDIDPayload` on the `ledgers` table. All the data in the column will be lost.
  - Added the required column `nymTxnEndpoint` to the `ledgers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ledgers" DROP COLUMN "registerDIDPayload";
ALTER TABLE "ledgers" RENAME COLUMN "registerDIDEndpoint" TO "nymTxnEndpoint";
