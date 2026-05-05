-- AddForeignKey
ALTER TABLE "ecosystem_invitations" ADD CONSTRAINT "ecosystem_invitations_invitedOrg_fkey" FOREIGN KEY ("invitedOrg") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
