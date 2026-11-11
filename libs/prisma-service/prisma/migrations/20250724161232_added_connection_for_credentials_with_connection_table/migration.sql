-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connections"("connectionId") ON DELETE SET NULL ON UPDATE CASCADE;
