/*
  Warnings:

  - The primary key for the `agent_invitations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `agents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `agents_type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `connections` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `credential_definition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `credentials` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ecosystem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ecosystem_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ecosystem_invitations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ecosystem_orgs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ecosystem_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ecosystem_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `endorsement_transaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `file_data` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `file_upload` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ledgers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `org_agents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `agentId` column on the `org_agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `agentsTypeId` column on the `org_agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orgId` column on the `org_agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orgAgentTypeId` column on the `org_agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ledgerId` column on the `org_agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `org_agents_type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `org_invitations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `org_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organisation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `platform_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `presentations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `schema` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `shortening_url` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_activity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_credentials` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_devices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `userId` column on the `user_devices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `user_org_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `orgId` column on the `user_org_roles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `id` on the `agent_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `agentId` on the `agent_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `agents_type` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `connections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orgId` on the `connections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `credential_definition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orgId` on the `credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ecosystem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ecosystem_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ecosystem_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ecosystemId` on the `ecosystem_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ecosystem_orgs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ecosystemId` on the `ecosystem_orgs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ecosystemRoleId` on the `ecosystem_orgs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ecosystem_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ecosystem_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ecosystemId` on the `ecosystem_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `endorsement_transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ecosystemOrgId` on the `endorsement_transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `file_data` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fileUploadId` on the `file_data` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `file_upload` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ledgers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `org_agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `org_agents_type` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `org_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `org_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orgId` on the `org_invitations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `org_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `organisation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `platform_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `presentations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orgId` on the `presentations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `schema` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orgId` on the `schema` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `shortening_url` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user_activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `user_activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orgId` on the `user_activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user_credentials` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user_devices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user_org_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `user_org_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orgRoleId` on the `user_org_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "agent_invitations" DROP CONSTRAINT "agent_invitations_agentId_fkey";

-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_orgId_fkey";

-- DropForeignKey
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_orgId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_invitations" DROP CONSTRAINT "ecosystem_invitations_ecosystemId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_orgs" DROP CONSTRAINT "ecosystem_orgs_ecosystemId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_orgs" DROP CONSTRAINT "ecosystem_orgs_ecosystemRoleId_fkey";

-- DropForeignKey
ALTER TABLE "ecosystem_users" DROP CONSTRAINT "ecosystem_users_ecosystemId_fkey";

-- DropForeignKey
ALTER TABLE "endorsement_transaction" DROP CONSTRAINT "endorsement_transaction_ecosystemOrgId_fkey";

-- DropForeignKey
ALTER TABLE "file_data" DROP CONSTRAINT "file_data_fileUploadId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_agentId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_agentsTypeId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_ledgerId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_orgAgentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_orgId_fkey";

-- DropForeignKey
ALTER TABLE "org_invitations" DROP CONSTRAINT "org_invitations_orgId_fkey";

-- DropForeignKey
ALTER TABLE "org_invitations" DROP CONSTRAINT "org_invitations_userId_fkey";

-- DropForeignKey
ALTER TABLE "presentations" DROP CONSTRAINT "presentations_orgId_fkey";

-- DropForeignKey
ALTER TABLE "schema" DROP CONSTRAINT "schema_orgId_fkey";

-- DropForeignKey
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_orgId_fkey";

-- DropForeignKey
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_devices" DROP CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af";

-- DropForeignKey
ALTER TABLE "user_org_roles" DROP CONSTRAINT "user_org_roles_orgId_fkey";

-- DropForeignKey
ALTER TABLE "user_org_roles" DROP CONSTRAINT "user_org_roles_orgRoleId_fkey";

-- DropForeignKey
ALTER TABLE "user_org_roles" DROP CONSTRAINT "user_org_roles_userId_fkey";

-- AlterTable
ALTER TABLE "agent_invitations" DROP CONSTRAINT "agent_invitations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "agentId",
ADD COLUMN     "agentId" UUID NOT NULL,
ADD CONSTRAINT "agent_invitations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "agents" DROP CONSTRAINT "agents_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "agents_type" DROP CONSTRAINT "agents_type_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "agents_type_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "connections" DROP CONSTRAINT "connections_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID NOT NULL,
ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "credential_definition" DROP CONSTRAINT "PK_c9e7e648903a9e537347aba4373",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "PK_c9e7e648903a9e537347aba4373" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID NOT NULL,
ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ecosystem" DROP CONSTRAINT "ecosystem_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "ecosystem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ecosystem_config" DROP CONSTRAINT "ecosystem_config_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "ecosystem_config_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ecosystem_invitations" DROP CONSTRAINT "ecosystem_invitations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ecosystemId",
ADD COLUMN     "ecosystemId" UUID NOT NULL,
ADD CONSTRAINT "ecosystem_invitations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ecosystem_orgs" DROP CONSTRAINT "ecosystem_orgs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ecosystemId",
ADD COLUMN     "ecosystemId" UUID NOT NULL,
DROP COLUMN "ecosystemRoleId",
ADD COLUMN     "ecosystemRoleId" UUID NOT NULL,
ADD CONSTRAINT "ecosystem_orgs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ecosystem_roles" DROP CONSTRAINT "ecosystem_roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "ecosystem_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ecosystem_users" DROP CONSTRAINT "ecosystem_users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ecosystemId",
ADD COLUMN     "ecosystemId" UUID NOT NULL,
ADD CONSTRAINT "ecosystem_users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "endorsement_transaction" DROP CONSTRAINT "endorsement_transaction_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ecosystemOrgId",
ADD COLUMN     "ecosystemOrgId" UUID NOT NULL,
ADD CONSTRAINT "endorsement_transaction_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "file_data" DROP CONSTRAINT "file_data_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "fileUploadId",
ADD COLUMN     "fileUploadId" UUID NOT NULL,
ADD CONSTRAINT "file_data_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "file_upload" DROP CONSTRAINT "file_upload_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "file_upload_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ledgers" DROP CONSTRAINT "ledgers_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "agentId",
ADD COLUMN     "agentId" UUID,
DROP COLUMN "agentsTypeId",
ADD COLUMN     "agentsTypeId" UUID,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID,
DROP COLUMN "orgAgentTypeId",
ADD COLUMN     "orgAgentTypeId" UUID,
DROP COLUMN "ledgerId",
ADD COLUMN     "ledgerId" UUID,
ADD CONSTRAINT "org_agents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "org_agents_type" DROP CONSTRAINT "org_agents_type_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "org_agents_type_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "org_invitations" DROP CONSTRAINT "org_invitations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID NOT NULL,
ADD CONSTRAINT "org_invitations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "org_roles" DROP CONSTRAINT "org_roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "org_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organisation" DROP CONSTRAINT "organisation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "organisation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "platform_config" DROP CONSTRAINT "platform_config_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "presentations" DROP CONSTRAINT "presentations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID NOT NULL,
ADD CONSTRAINT "presentations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "schema" DROP CONSTRAINT "PK_c9e7e648903a9e537347aba4372",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID NOT NULL,
ADD CONSTRAINT "PK_c9e7e648903a9e537347aba4372" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "shortening_url" DROP CONSTRAINT "shortening_url_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "shortening_url_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID NOT NULL,
ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_credentials" DROP CONSTRAINT "user_credentials_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_devices" DROP CONSTRAINT "PK_c9e7e648903a9e537347aba4371",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID,
ADD CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_org_roles" DROP CONSTRAINT "user_org_roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "orgRoleId",
ADD COLUMN     "orgRoleId" UUID NOT NULL,
DROP COLUMN "orgId",
ADD COLUMN     "orgId" UUID,
ADD CONSTRAINT "user_org_roles_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "org_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_agentsTypeId_fkey" FOREIGN KEY ("agentsTypeId") REFERENCES "agents_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgAgentTypeId_fkey" FOREIGN KEY ("orgAgentTypeId") REFERENCES "org_agents_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema" ADD CONSTRAINT "schema_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_invitations" ADD CONSTRAINT "agent_invitations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "org_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_invitations" ADD CONSTRAINT "ecosystem_invitations_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_users" ADD CONSTRAINT "ecosystem_users_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_ecosystemRoleId_fkey" FOREIGN KEY ("ecosystemRoleId") REFERENCES "ecosystem_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsement_transaction" ADD CONSTRAINT "endorsement_transaction_ecosystemOrgId_fkey" FOREIGN KEY ("ecosystemOrgId") REFERENCES "ecosystem_orgs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_data" ADD CONSTRAINT "file_data_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "file_upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
