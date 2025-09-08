-- CreateTable
CREATE TABLE "client_aliases" (
    "id" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientAlias" TEXT,
    "clientUrl" TEXT NOT NULL,

    CONSTRAINT "client_aliases_pkey" PRIMARY KEY ("id")
);
