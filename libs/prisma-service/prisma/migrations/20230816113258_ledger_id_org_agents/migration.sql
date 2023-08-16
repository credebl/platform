/*
  Warnings:

  - Added the required column `ledgerId` to the `org_agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "org_agents" ADD COLUMN     "ledgerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
