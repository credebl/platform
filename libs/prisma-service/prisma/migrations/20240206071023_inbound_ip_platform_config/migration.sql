/*
  Warnings:

  - You are about to drop the column `lastInternalId` on the `platform_config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "platform_config" DROP COLUMN "lastInternalId",
ADD COLUMN     "inboundEndpoint" VARCHAR;
