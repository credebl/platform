/*
  Warnings:

  - You are about to drop the column `webhookEndpoint` on the `notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notification" DROP COLUMN "webhookEndpoint",
ADD COLUMN     "notificationWebhook" TEXT;
