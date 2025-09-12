/*
  Warnings:

  - You are about to drop the column `issuer` on the `credential_templates` table. All the data in the column will be lost.
  - Added the required column `issuerId` to the `credential_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "credential_templates" DROP COLUMN "issuer",
ADD COLUMN     "issuerId" UUID NOT NULL,
ALTER COLUMN "attributes" SET DATA TYPE JSONB,
ALTER COLUMN "appearance" SET DATA TYPE JSONB,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "oidc_issuer" (
    "id" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "agentIssuerId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "oidc_issuer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "oidc_issuer" ADD CONSTRAINT "oidc_issuer_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "org_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_templates" ADD CONSTRAINT "credential_templates_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "oidc_issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
