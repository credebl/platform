/*
  Warnings:

  - You are about to drop the column `createdBy` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `lastChangedBy` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "createdBy",
DROP COLUMN "lastChangedBy";
