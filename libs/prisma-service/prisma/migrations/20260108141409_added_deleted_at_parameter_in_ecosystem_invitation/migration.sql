-- AlterTable
ALTER TABLE "ecosystem_invitations" ADD COLUMN     "deletedAt" TIMESTAMP(6),
ADD COLUMN     "ecosystemId" UUID;

-- AddForeignKey
ALTER TABLE "ecosystem_invitations" ADD CONSTRAINT "ecosystem_invitations_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
