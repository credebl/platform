-- CreateTable
CREATE TABLE "user_credentials" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT,
    "credentialId" TEXT,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT '1',
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" TEXT NOT NULL DEFAULT '1',
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);
