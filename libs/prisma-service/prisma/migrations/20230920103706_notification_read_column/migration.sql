/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `notifications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "notifications_orgId_key";

-- DropIndex
DROP INDEX "notifications_userId_key";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "deletedAt",
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_pkey" PRIMARY KEY ("id");
