/*
  Warnings:

  - A unique constraint covering the columns `[recordId]` on the table `credentials` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[recordId]` on the table `presentations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `threadId` to the `connections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordId` to the `credentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordId` to the `presentations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "threadId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "recordId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "presentations" ADD COLUMN     "recordId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "userId" INTEGER NOT NULL,
    "orgId" INTEGER NOT NULL,
    "recordId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "deletedAt" INTEGER NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_key" ON "notifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_orgId_key" ON "notifications"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_recordId_key" ON "notifications"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_recordId_key" ON "credentials"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "presentations_recordId_key" ON "presentations"("recordId");
