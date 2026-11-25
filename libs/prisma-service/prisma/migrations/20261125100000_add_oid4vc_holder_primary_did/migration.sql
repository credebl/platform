-- CreateTable
CREATE TABLE "oid4vc_holder_primary_did" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "holderTenantId" TEXT NOT NULL,
    "didUrl" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oid4vc_holder_primary_did_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oid4vc_holder_primary_did_orgId_userId_holderTenantId_key" ON "oid4vc_holder_primary_did"("orgId", "userId", "holderTenantId");

-- CreateIndex
CREATE INDEX "oid4vc_holder_primary_did_userId_holderTenantId_idx" ON "oid4vc_holder_primary_did"("userId", "holderTenantId");

-- AddForeignKey
ALTER TABLE "oid4vc_holder_primary_did" ADD CONSTRAINT "oid4vc_holder_primary_did_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oid4vc_holder_primary_did" ADD CONSTRAINT "oid4vc_holder_primary_did_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
