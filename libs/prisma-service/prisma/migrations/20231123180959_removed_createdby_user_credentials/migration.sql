/*
  Warnings:

  - You are about to drop the column `createdBy` on the `user_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `lastChangedBy` on the `user_credentials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_credentials" DROP COLUMN "createdBy",
DROP COLUMN "lastChangedBy";
