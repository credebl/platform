-- AlterTable
ALTER TABLE "intent_notices" ADD COLUMN     "orgId" UUID;

-- CreateIndex
CREATE INDEX "intent_notices_orgId_idx" ON "intent_notices"("orgId");

-- AddForeignKey
ALTER TABLE "intent_notices" ADD CONSTRAINT "intent_notices_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
