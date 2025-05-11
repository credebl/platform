/*
  Warnings:

  - A unique constraint covering the columns `[orgId]` on the table `org_agents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "org_agents_orgId_key" ON "org_agents"("orgId");
