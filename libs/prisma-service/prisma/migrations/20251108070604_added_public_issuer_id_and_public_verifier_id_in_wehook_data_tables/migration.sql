/*
  Warnings:

  - Added the required column `publicIssuerId` to the `oid4vc_credentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicVerifierId` to the `oid4vp_presentations` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
-- Add the column first
ALTER TABLE "oid4vc_credentials"
ADD COLUMN "publicIssuerId" TEXT;

-- Optional: add a temporary default or backfill
UPDATE "oid4vc_credentials" SET "publicIssuerId" = 'default-issuer';

-- Make it required if needed
ALTER TABLE "oid4vc_credentials"
ALTER COLUMN "publicIssuerId" SET NOT NULL;


-- AlterTable
ALTER TABLE "oid4vp_presentations" ADD COLUMN     "publicVerifierId" TEXT;
UPDATE "oid4vp_presentations" SET "publicVerifierId" = 'default-verifier-id';
ALTER TABLE "oid4vp_presentations" ALTER COLUMN "publicVerifierId" SET NOT NULL;
