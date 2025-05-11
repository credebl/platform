-- CreateTable
CREATE TABLE "org_dids" (
    "id" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "primaryDid" BOOLEAN NOT NULL,
    "did" VARCHAR NOT NULL,
    "didDocument" JSONB,
    "orgAgentId" UUID NOT NULL,

    CONSTRAINT "org_dids_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "org_dids" ADD CONSTRAINT "org_dids_orgAgentId_fkey" FOREIGN KEY ("orgAgentId") REFERENCES "org_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
