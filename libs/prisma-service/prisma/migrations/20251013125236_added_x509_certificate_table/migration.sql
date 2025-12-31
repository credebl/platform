
-- CreateTable
CREATE TABLE "oid4vc_credentials" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "offerId" TEXT NOT NULL,
    "credentialOfferId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "contextCorrelationId" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,

    CONSTRAINT "oid4vc_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "x509_certificates" (
    "id" TEXT NOT NULL,
    "orgAgentId" UUID NOT NULL,
    "keyType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "certificateBase64" TEXT NOT NULL,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMP(3) NOT NULL,
    "lastChangedBy" UUID NOT NULL,

    CONSTRAINT "x509_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oid4vc_credentials_offerId_key" ON "oid4vc_credentials"("offerId");

-- AddForeignKey
ALTER TABLE "oid4vc_credentials" ADD CONSTRAINT "oid4vc_credentials_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "x509_certificates" ADD CONSTRAINT "x509_certificates_orgAgentId_fkey" FOREIGN KEY ("orgAgentId") REFERENCES "org_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
