/*
  Warnings:

  - You are about to drop the column `primaryDid` on the `org_dids` table. All the data in the column will be lost.
  - You are about to alter the column `did` on the `org_dids` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(500)`.
  - Added the required column `isPrimaryDid` to the `org_dids` table without a default value. This is not possible if the table is not empty.
  - Made the column `didDocument` on table `org_dids` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "org_dids" DROP COLUMN "primaryDid",
ADD COLUMN     "isPrimaryDid" BOOLEAN NOT NULL,
ALTER COLUMN "did" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "didDocument" SET NOT NULL;
