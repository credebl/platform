/*
  Warnings:

  - The primary key for the `connections` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `credential_definition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `credentials` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `org_invitations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `org_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organisation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `schema` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_activity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_org_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "agent_invitations" DROP CONSTRAINT "agent_invitations_agentId_fkey";

-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_orgId_fkey";

-- DropForeignKey
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_orgId_fkey";

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

-- DropIndex
DROP INDEX "agent_invitations_id_key";

-- DropIndex
DROP INDEX "org_agents_id_key";

-- DropIndex
DROP INDEX "presentations_id_key";

-- AlterTable
ALTER TABLE "agent_invitations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DEFAULT '1',
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ALTER COLUMN "agentId" SET DEFAULT '1',
ALTER COLUMN "agentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "agent_invitations_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "agent_invitations_id_seq";

-- AlterTable
ALTER TABLE "connections" DROP CONSTRAINT "connections_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "connections_id_seq";

-- AlterTable
ALTER TABLE "credential_definition" DROP CONSTRAINT "PK_c9e7e648903a9e537347aba4373",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "schemaId" SET DEFAULT '1',
ALTER COLUMN "schemaId" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DEFAULT '1',
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PK_c9e7e648903a9e537347aba4373" PRIMARY KEY ("id");
DROP SEQUENCE "credential_definition_id_seq";

-- AlterTable
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "credentials_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "credentials_id_seq";

-- AlterTable
ALTER TABLE "org_agents" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "org_agents_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "org_agents_id_seq";

-- AlterTable
ALTER TABLE "org_invitations" DROP CONSTRAINT "org_invitations_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ALTER COLUMN "orgRoles" SET DATA TYPE TEXT[],
ADD CONSTRAINT "org_invitations_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "org_invitations_id_seq";

-- AlterTable
ALTER TABLE "org_roles" DROP CONSTRAINT "org_roles_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "org_roles_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "org_roles_id_seq";

-- AlterTable
ALTER TABLE "organisation" DROP CONSTRAINT "organisation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "organisation_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "organisation_id_seq";

-- AlterTable
ALTER TABLE "presentations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "presentations_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "presentations_id_seq";

-- AlterTable
ALTER TABLE "schema" DROP CONSTRAINT "PK_c9e7e648903a9e537347aba4372",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "ledgerId" SET DEFAULT '1',
ALTER COLUMN "ledgerId" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PK_c9e7e648903a9e537347aba4372" PRIMARY KEY ("id");
DROP SEQUENCE "schema_id_seq";

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id");
DROP SEQUENCE "user_id_seq";

-- AlterTable
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_activity_id_seq";

-- AlterTable
ALTER TABLE "user_devices" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_org_roles" DROP CONSTRAINT "user_org_roles_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "orgRoleId" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_org_roles_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "user_org_roles_id_seq";

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
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
