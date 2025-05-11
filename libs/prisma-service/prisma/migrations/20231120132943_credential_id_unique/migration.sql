/*
  Warnings:

  - A unique constraint covering the columns `[credentialId]` on the table `user_credentials` will be added. If there are existing duplicate values, this will fail.
  - Made the column `credentialId` on table `user_credentials` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user_credentials" ALTER COLUMN "credentialId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_credentialId_key" ON "user_credentials"("credentialId");
