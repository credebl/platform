/*
  Warnings:

  - You are about to drop the column `accessTokenSignerKeyType` on the `oidc_issuer` table. All the data in the column will be lost.
  - Added the required column `signerOption` to the `credential_templates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SignerOption" AS ENUM ('did', 'x509');

-- AlterTable
ALTER TABLE "credential_templates" ADD COLUMN     "signerOption" "SignerOption" NOT NULL;

-- AlterTable
ALTER TABLE "oidc_issuer" DROP COLUMN "accessTokenSignerKeyType";

-- DropEnum
DROP TYPE "AccessTokenSignerKeyType";
