/*
  Warnings:

  - You are about to alter the column `username` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(255)`.
  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "username" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_username" ON "user"("username");
