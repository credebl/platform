-- CreateTable
CREATE TABLE "oid4vp_verifier" (
    "id" UUID NOT NULL,
    "publicVerifierId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "verifierId" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT '1',
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" TEXT NOT NULL DEFAULT '1',
    "deletedAt" TIMESTAMP(6),
    "orgAgentId" UUID NOT NULL,

    CONSTRAINT "oid4vp_verifier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oid4vp_verifier_verifierId_key" ON "oid4vp_verifier"("verifierId");

-- CreateIndex
CREATE INDEX "oid4vp_verifier_orgAgentId_idx" ON "oid4vp_verifier"("orgAgentId");

-- AddForeignKey
ALTER TABLE "oid4vp_verifier" ADD CONSTRAINT "oid4vp_verifier_orgAgentId_fkey" FOREIGN KEY ("orgAgentId") REFERENCES "org_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
