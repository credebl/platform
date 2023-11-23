/*
  Warnings:

  - A unique constraint covering the columns `[threadId]` on the table `credentials` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[threadId]` on the table `presentations` will be added. If there are existing duplicate values, this will fail.
  - Made the column `threadId` on table `presentations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "credentials_connectionId_key";

-- DropIndex
DROP INDEX "presentations_connectionId_key";

-- AlterTable
ALTER TABLE "credentials" ALTER COLUMN "connectionId" DROP NOT NULL,
ALTER COLUMN "protocolVersion" DROP NOT NULL;

-- AlterTable
ALTER TABLE "presentations" ALTER COLUMN "connectionId" DROP NOT NULL,
ALTER COLUMN "threadId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "credentials_threadId_key" ON "credentials"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "presentations_threadId_key" ON "presentations"("threadId");
