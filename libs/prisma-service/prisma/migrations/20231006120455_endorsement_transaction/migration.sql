-- CreateTable
CREATE TABLE "endorsement_transaction" (
    "id" TEXT NOT NULL,
    "endorserDid" TEXT NOT NULL,
    "authorDid" TEXT NOT NULL,
    "requestPayload" TEXT NOT NULL,
    "responsePayload" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ecosystemOrgId" TEXT NOT NULL,

    CONSTRAINT "endorsement_transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "endorsement_transaction" ADD CONSTRAINT "endorsement_transaction_ecosystemOrgId_fkey" FOREIGN KEY ("ecosystemOrgId") REFERENCES "ecosystem_orgs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
