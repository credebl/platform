/*
  Warnings:

  - A unique constraint covering the columns `[email,ecosystemId,invitedOrg]` on the table `ecosystem_invitations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ecosystem_invitations_email_ecosystemId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ecosystem_invitations_email_ecosystemId_invitedOrg_key" ON "ecosystem_invitations"("email", "ecosystemId", "invitedOrg");
