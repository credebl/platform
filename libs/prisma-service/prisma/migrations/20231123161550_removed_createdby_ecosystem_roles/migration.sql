/*
  Warnings:

  - You are about to drop the column `createdBy` on the `ecosystem_roles` table. All the data in the column will be lost.
  - You are about to drop the column `lastChangedBy` on the `ecosystem_roles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ecosystem_roles" DROP COLUMN "createdBy",
DROP COLUMN "lastChangedBy";
