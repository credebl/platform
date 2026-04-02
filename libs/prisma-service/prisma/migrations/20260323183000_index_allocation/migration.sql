-- CreateTable
CREATE TABLE "status_list_allocation" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "issuerDid" TEXT NOT NULL,
    "listId" UUID NOT NULL,
    "listSize" INTEGER NOT NULL DEFAULT 131072,
    "allocatedCount" INTEGER NOT NULL DEFAULT 0,
    "bitmap" BYTEA NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_list_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_oid4vc_credentials" (
    "id" UUID NOT NULL,
    "credentialId" TEXT NOT NULL,
    "listId" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "issuanceSessionId" VARCHAR NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statusListUri" TEXT NOT NULL,

    CONSTRAINT "issued_oid4vc_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_list_allocation_listId_key" ON "status_list_allocation"("listId");

-- CreateIndex
CREATE INDEX "status_list_allocation_orgId_isActive_idx" ON "status_list_allocation"("orgId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "issued_oid4vc_credentials_credentialId_key" ON "issued_oid4vc_credentials"("credentialId");

-- AddForeignKey
ALTER TABLE "status_list_allocation" ADD CONSTRAINT "status_list_allocation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add webhookSecret safely
ALTER TABLE "org_agents" ADD COLUMN IF NOT EXISTS "webhookSecret" VARCHAR;
