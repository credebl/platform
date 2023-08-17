-- AlterTable
ALTER TABLE "org_agents" ADD COLUMN     "ledgerId" INTEGER;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
