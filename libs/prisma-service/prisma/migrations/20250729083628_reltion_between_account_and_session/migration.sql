/*
  Warnings:

  - A unique constraint covering the columns `[accountId]` on the table `session` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "session" ADD COLUMN     "accountId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "session_accountId_key" ON "session"("accountId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
