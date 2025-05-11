-- CreateTable
CREATE TABLE "ledgerConfig" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT '1',
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" TEXT NOT NULL DEFAULT '1',
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ledgerConfig_pkey" PRIMARY KEY ("id")
);
