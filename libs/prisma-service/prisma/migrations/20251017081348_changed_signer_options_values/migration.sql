/*
  Warnings:

  - The values [did,x509] on the enum `SignerOption` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SignerOption_new" AS ENUM ('DID', 'X509_P256', 'X509_ED25519');
ALTER TABLE "credential_templates" ALTER COLUMN "signerOption" TYPE "SignerOption_new" USING ("signerOption"::text::"SignerOption_new");
ALTER TYPE "SignerOption" RENAME TO "SignerOption_old";
ALTER TYPE "SignerOption_new" RENAME TO "SignerOption";
DROP TYPE "SignerOption_old";
COMMIT;
