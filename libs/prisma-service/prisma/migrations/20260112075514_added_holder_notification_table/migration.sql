-- CreateTable
CREATE TABLE "holder_notification" (
    "id" UUID NOT NULL,
    "sessionId" TEXT NOT NULL,
    "holderDid" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "holder_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "holder_notification_sessionId_key" ON "holder_notification"("sessionId");
