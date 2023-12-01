-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_agentsTypeId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_orgAgentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "org_agents" DROP CONSTRAINT "org_agents_orgId_fkey";

-- AlterTable
ALTER TABLE "org_agents" ALTER COLUMN "lastChangedBy" DROP NOT NULL,
ALTER COLUMN "orgDid" DROP NOT NULL,
ALTER COLUMN "verkey" DROP NOT NULL,
ALTER COLUMN "agentEndPoint" DROP NOT NULL,
ALTER COLUMN "isDidPublic" DROP NOT NULL,
ALTER COLUMN "agentSpinUpStatus" DROP NOT NULL,
ALTER COLUMN "agentsTypeId" DROP NOT NULL,
ALTER COLUMN "orgId" DROP NOT NULL,
ALTER COLUMN "orgAgentTypeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_agentsTypeId_fkey" FOREIGN KEY ("agentsTypeId") REFERENCES "agents_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgAgentTypeId_fkey" FOREIGN KEY ("orgAgentTypeId") REFERENCES "org_agents_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
