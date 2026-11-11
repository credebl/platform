-- AddForeignKey
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("connectionId") ON DELETE SET NULL ON UPDATE CASCADE;
