-- AlterTable
ALTER TABLE "oidc_issuer" ADD COLUMN     "cryptographicBindingMethods" TEXT[] DEFAULT ARRAY[]::TEXT[];
