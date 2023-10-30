/*
  Warnings:

  - Added the required column `resourceId` to the `endorsement_transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "endorsement_transaction" ADD COLUMN     "resourceId" TEXT NOT NULL;
