-- AlterTable
ALTER TABLE "organisation" ADD COLUMN     "publicProfile" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "publicProfile" BOOLEAN NOT NULL DEFAULT false;
