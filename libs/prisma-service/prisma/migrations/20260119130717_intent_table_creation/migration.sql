/*
  Warnings:

  - Added the required column `ecosystemId` to the `intents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "intents" ADD COLUMN     "ecosystemId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "intents" ADD CONSTRAINT "intents_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
