/*
  Warnings:

  - You are about to drop the column `orgDid` on the `ecosystem_orgs` table. All the data in the column will be lost.
  - You are about to drop the column `orgName` on the `ecosystem_orgs` table. All the data in the column will be lost.
  - Changed the type of `orgId` on the `ecosystem_orgs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ecosystem_orgs" 
DROP COLUMN "orgDid",
DROP COLUMN "orgName",
ALTER COLUMN "orgId" TYPE uuid USING "orgId"::uuid;


-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
