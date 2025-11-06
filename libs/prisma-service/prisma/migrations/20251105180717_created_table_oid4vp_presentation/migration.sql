-- CreateTable
CREATE TABLE "oid4vp_presentations" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "verificationSessionId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "contextCorrelationId" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,

    CONSTRAINT "oid4vp_presentations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oid4vp_presentations_verificationSessionId_key" ON "oid4vp_presentations"("verificationSessionId");

-- AddForeignKey
ALTER TABLE "oid4vp_presentations" ADD CONSTRAINT "oid4vp_presentations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
