/*
  Warnings:

  - You are about to drop the column `access_token` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `session_state` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refreshToken]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accessToken]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refreshToken]` on the table `session` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "account_access_token_key";

-- DropIndex
DROP INDEX "account_refresh_token_key";

-- DropIndex
DROP INDEX "session_refresh_token_key";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "access_token",
DROP COLUMN "expires_at",
DROP COLUMN "id_token",
DROP COLUMN "refresh_token",
DROP COLUMN "session_state",
DROP COLUMN "token_type",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "expiresAt" INTEGER,
ADD COLUMN     "idToken" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "sessionState" TEXT,
ADD COLUMN     "tokenType" TEXT;

-- AlterTable
ALTER TABLE "session" DROP COLUMN "refresh_token",
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "sessionType" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "account_refreshToken_key" ON "account"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "account_accessToken_key" ON "account"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "session_refreshToken_key" ON "session"("refreshToken");
