/*
  Warnings:

  - You are about to drop the column `agentIssuerId` on the `oidc_issuer` table. All the data in the column will be lost.
  - Added the required column `orgAgentId` to the `oidc_issuer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicIssuerId` to the `oidc_issuer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "oidc_issuer" DROP CONSTRAINT "oidc_issuer_createdBy_fkey";

-- AlterTable
ALTER TABLE "oidc_issuer" DROP COLUMN "agentIssuerId",
ADD COLUMN     "orgAgentId" UUID NOT NULL,
ADD COLUMN     "publicIssuerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "oidc_issuer_orgAgentId_idx" ON "oidc_issuer"("orgAgentId");

-- AddForeignKey
ALTER TABLE "oidc_issuer" ADD CONSTRAINT "oidc_issuer_orgAgentId_fkey" FOREIGN KEY ("orgAgentId") REFERENCES "org_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
