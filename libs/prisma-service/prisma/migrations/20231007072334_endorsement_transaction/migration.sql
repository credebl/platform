-- CreateTable
CREATE TABLE "endorsement_transaction" (
    "id" TEXT NOT NULL,
    "endorserDid" VARCHAR,
    "authorDid" VARCHAR,
    "requestPayload" VARCHAR,
    "responsePayload" VARCHAR,
    "status" VARCHAR,
    "ecosystemOrgId" VARCHAR,

    CONSTRAINT "endorsement_transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "endorsement_transaction" ADD CONSTRAINT "endorsement_transaction_ecosystemOrgId_fkey" FOREIGN KEY ("ecosystemOrgId") REFERENCES "ecosystem_orgs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
