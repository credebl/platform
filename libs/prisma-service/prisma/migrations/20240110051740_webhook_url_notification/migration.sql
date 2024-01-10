/*
  Warnings:

  - You are about to drop the column `fcmToken` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `userKey` on the `notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notification" DROP COLUMN "fcmToken",
DROP COLUMN "userKey";
