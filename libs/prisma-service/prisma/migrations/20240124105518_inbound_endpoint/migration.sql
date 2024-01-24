/*
  Warnings:

  - You are about to drop the column `lastInternalId` on the `platform_config` table. All the data in the column will be lost.
  - Added the required column `inboundEndpoint` to the `platform_config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "platform_config" DROP COLUMN "lastInternalId",
ADD COLUMN     "inboundEndpoint" VARCHAR NOT NULL;
