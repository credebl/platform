ALTER TABLE "credentials"
ADD COLUMN "statusListId" UUID,
ADD COLUMN "statusListIndex" INTEGER,
ADD COLUMN "statusListUri" TEXT,
ADD COLUMN "credentialVersion" TEXT,
ADD COLUMN "revokedAt" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "credentials_statusListId_statusListIndex_key"
ON "credentials"("statusListId", "statusListIndex");
