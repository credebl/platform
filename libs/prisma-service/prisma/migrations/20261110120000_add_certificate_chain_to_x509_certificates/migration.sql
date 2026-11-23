-- AlterTable
ALTER TABLE "x509_certificates" ADD COLUMN     "certificateChain" TEXT[] DEFAULT ARRAY[]::TEXT[];
