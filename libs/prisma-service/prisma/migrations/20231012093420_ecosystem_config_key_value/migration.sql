/*
  Warnings:

  - You are about to drop the column `autoEndorsement` on the `ecosystem_config` table. All the data in the column will be lost.
  - You are about to drop the column `enableEcosystem` on the `ecosystem_config` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `ecosystem_config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ecosystem_config" DROP COLUMN "autoEndorsement",
DROP COLUMN "enableEcosystem",
DROP COLUMN "url",
ADD COLUMN     "key" TEXT,
ADD COLUMN     "value" TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ecosystem_orgs" ADD COLUMN     "deploymentMode" TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;
