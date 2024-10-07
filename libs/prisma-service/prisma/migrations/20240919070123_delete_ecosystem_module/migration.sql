/*
  Warnings:

  - You are about to drop the `ecosystem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ecosystem_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ecosystem_invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ecosystem_orgs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ecosystem_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ecosystem_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `endorsement_transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ecosystem_invitations" DROP CONSTRAINT "ecosystem_invitations_ecosystemId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_orgs" DROP CONSTRAINT "ecosystem_orgs_ecosystemId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_orgs" DROP CONSTRAINT "ecosystem_orgs_ecosystemRoleId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_orgs" DROP CONSTRAINT "ecosystem_orgs_orgId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_users" DROP CONSTRAINT "ecosystem_users_ecosystemId_fkey";

-- DropForeignKey
ALTER TABLE "endorsement_transaction" DROP CONSTRAINT "endorsement_transaction_ecosystemOrgId_fkey";

-- DropTable
DROP TABLE "ecosystem";

-- DropTable
DROP TABLE "ecosystem_config";

-- DropTable
DROP TABLE "ecosystem_invitations";

-- DropTable
DROP TABLE "ecosystem_orgs";

-- DropTable
DROP TABLE "ecosystem_roles";

-- DropTable
DROP TABLE "ecosystem_users";

-- DropTable
DROP TABLE "endorsement_transaction";
