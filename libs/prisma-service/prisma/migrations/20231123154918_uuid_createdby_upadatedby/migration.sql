/*
  Warnings:

  - You are about to drop the column `createdBy` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `lastChangedBy` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `agents_type` table. All the data in the column will be lost.
  - You are about to drop the column `lastChangedBy` on the `agents_type` table. All the data in the column will be lost.
  - The `orgId` column on the `credential_definition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orgId` column on the `file_upload` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdBy` on the `ledgers` table. All the data in the column will be lost.
  - You are about to drop the column `lastChangedBy` on the `ledgers` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `org_agents_type` table. All the data in the column will be lost.
  - You are about to drop the column `lastChangedBy` on the `org_agents_type` table. All the data in the column will be lost.
  - The `ledgerId` column on the `schema` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `orgId` on the `agent_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `connections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `connections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `credential_definition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `credential_definition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `schemaId` on the `credential_definition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `ecosystem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `ecosystem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `ecosystem_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `ecosystem_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `ecosystem_orgs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `ecosystem_orgs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `ecosystem_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `ecosystem_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `ecosystem_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `ecosystem_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `endorsement_transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `endorsement_transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `file_data` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `file_data` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `file_upload` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `file_upload` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `org_agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `lastChangedBy` to the `org_agents` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `createdBy` on the `org_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `org_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `organisation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `organisation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `presentations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `presentations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `schema` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `schema` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `user_activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `user_activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `user_credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `user_credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `createdBy` on the `user_devices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastChangedBy` on the `user_devices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "agent_invitations" DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "createdBy",
DROP COLUMN "lastChangedBy";

-- AlterTable
ALTER TABLE "agents_type" DROP COLUMN "createdBy",
DROP COLUMN "lastChangedBy";

-- AlterTable
ALTER TABLE "connections" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "credential_definition" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL,
DROP COLUMN "schemaId",
ADD COLUMN     "schemaId" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID;

-- AlterTable
ALTER TABLE "credentials" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ecosystem" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ecosystem_invitations" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ecosystem_orgs" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ecosystem_roles" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ecosystem_users" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "endorsement_transaction" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "file_data" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "file_upload" DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID,
DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ledgers" DROP COLUMN "createdBy",
DROP COLUMN "lastChangedBy";

-- AlterTable
ALTER TABLE "org_agents" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "org_agents_type" DROP COLUMN "createdBy",
DROP COLUMN "lastChangedBy";

-- AlterTable
ALTER TABLE "org_invitations" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "organisation" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "presentations" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "schema" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL,
DROP COLUMN "ledgerId",
ADD COLUMN     "ledgerId" UUID;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "user_activity" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "user_credentials" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "user_devices" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" UUID NOT NULL,
DROP COLUMN "lastChangedBy",
ADD COLUMN     "lastChangedBy" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "schema" ADD CONSTRAINT "schema_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_definition" ADD CONSTRAINT "credential_definition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_definition" ADD CONSTRAINT "credential_definition_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "schema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_invitations" ADD CONSTRAINT "agent_invitations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload" ADD CONSTRAINT "file_upload_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
