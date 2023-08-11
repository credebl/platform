-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
