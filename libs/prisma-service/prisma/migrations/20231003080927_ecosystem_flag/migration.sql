/*
  Warnings:

  - The primary key for the `ecosystem_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ecosystem_orgs" DROP CONSTRAINT "ecosystem_orgs_ecosystemRoleId_fkey";

-- AlterTable
ALTER TABLE "ecosystem_orgs" ALTER COLUMN "ecosystemRoleId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ecosystem_roles" DROP CONSTRAINT "ecosystem_roles_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ecosystem_roles_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ecosystem_roles_id_seq";

-- AlterTable
ALTER TABLE "platform_config" ADD COLUMN     "enableEcosystem" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_ecosystemRoleId_fkey" FOREIGN KEY ("ecosystemRoleId") REFERENCES "ecosystem_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
