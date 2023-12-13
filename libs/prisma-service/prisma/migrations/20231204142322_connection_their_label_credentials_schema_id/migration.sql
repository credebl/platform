/*
  Warnings:

  - Added the required column `schemaId` to the `credentials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "theirLabel" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "schemaId" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "credDefId" TEXT NOT NULL DEFAULT '';

