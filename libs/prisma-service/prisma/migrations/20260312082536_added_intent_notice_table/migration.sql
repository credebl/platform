-- CreateTable
CREATE TABLE "intent_notices" (
    "id" UUID NOT NULL,
    "intentId" UUID NOT NULL,
    "noticeUrl" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" TEXT NOT NULL,

    CONSTRAINT "intent_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intent_notices_intentId_idx" ON "intent_notices"("intentId");

-- AddForeignKey
ALTER TABLE "intent_notices" ADD CONSTRAINT "intent_notices_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
