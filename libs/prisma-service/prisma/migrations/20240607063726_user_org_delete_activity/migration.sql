-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('VERIFICATION_RECORD', 'ISSUANCE_RECORD', 'CONNECTION', 'ECOSYSTEM_MEMBER', 'ORGANIZATION', 'WALLET', 'INVITATION');

-- CreateTable
CREATE TABLE "user_org_delete_activity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "recordType" "RecordType" NOT NULL,
    "txnMetadata" JSONB NOT NULL,
    "createdBy" UUID NOT NULL,
    "lastChangedBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_org_delete_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_org_delete_activity_userId_key" ON "user_org_delete_activity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_org_delete_activity_orgId_key" ON "user_org_delete_activity"("orgId");
