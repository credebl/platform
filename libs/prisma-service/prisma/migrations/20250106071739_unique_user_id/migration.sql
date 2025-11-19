/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `cloud_wallet_user_info` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cloud_wallet_user_info_userId_key" ON "cloud_wallet_user_info"("userId");
