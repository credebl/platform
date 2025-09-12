-- CreateEnum
CREATE TYPE "AccessTokenSignerKeyType" AS ENUM ('ed25519');

-- AlterTable
ALTER TABLE "oidc_issuer" ADD COLUMN     "accessTokenSignerKeyType" "AccessTokenSignerKeyType"[] DEFAULT ARRAY['ed25519']::"AccessTokenSignerKeyType"[],
ADD COLUMN     "batchCredentialIssuanceSize" INTEGER NOT NULL DEFAULT 0;
