/*
  Warnings:
  - You are about to drop the column `enableEcosystem` on the `platform_config` table. All the data in the column will be lost.
*/
-- AlterTable
ALTER TABLE "platform_config" DROP COLUMN "enableEcosystem";

-- CreateTable
CREATE TABLE "ecosystem_config" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enableEcosystem" BOOLEAN NOT NULL DEFAULT false,
    "autoEndorsement" BOOLEAN NOT NULL DEFAULT false,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_config_pkey" PRIMARY KEY ("id")
);