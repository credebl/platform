-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "orgId" UUID,
    "notificationWebhook" TEXT,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT '1',
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" TEXT NOT NULL DEFAULT '1',
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_orgId_key" ON "notification"("orgId");
