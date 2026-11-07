-- AlterTable
ALTER TABLE "org_dids" ADD COLUMN     "archivedAt" TIMESTAMPTZ(6),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wasPrimary" BOOLEAN NOT NULL DEFAULT true;
