/*
  Warnings:

  - The primary key for the `agents_type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `org_agents_type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `platform_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_devices` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_agentId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_agentsTypeId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_ledgerId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_orgAgentTypeId_fkey";

-- DropIndex
DROP INDEX "agents_id_key";

-- DropIndex
DROP INDEX "ledgers_id_key";

-- AlterTable
ALTER TABLE "agents" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "agents_id_seq";

-- AlterTable
ALTER TABLE "agents_type" DROP CONSTRAINT "agents_type_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "agents_type_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "agents_type_id_seq";

-- AlterTable
ALTER TABLE "credential_definition" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "credentials" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ecosystem" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ecosystem_invitations" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ecosystem_roles" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ecosystem_users" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "endorsement_transaction" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ledgers" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ledgers_id_seq";

-- AlterTable
ALTER TABLE "org_agents" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ALTER COLUMN "agentId" SET DATA TYPE TEXT,
ALTER COLUMN "agentsTypeId" SET DATA TYPE TEXT,
ALTER COLUMN "orgAgentTypeId" SET DATA TYPE TEXT,
ALTER COLUMN "ledgerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "org_agents_type" DROP CONSTRAINT "org_agents_type_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "org_agents_type_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "org_agents_type_id_seq";

-- AlterTable
ALTER TABLE "org_invitations" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "org_roles" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "organisation" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "platform_config" DROP CONSTRAINT "platform_config_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "platform_config_id_seq";

-- AlterTable
ALTER TABLE "presentations" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "schema" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_activity" ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_devices" DROP CONSTRAINT "PK_c9e7e648903a9e537347aba4371",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DEFAULT '1',
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ALTER COLUMN "lastChangedBy" SET DEFAULT '1',
ALTER COLUMN "lastChangedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id");
DROP SEQUENCE "user_devices_id_seq";

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_agentsTypeId_fkey" FOREIGN KEY ("agentsTypeId") REFERENCES "agents_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgAgentTypeId_fkey" FOREIGN KEY ("orgAgentTypeId") REFERENCES "org_agents_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
