-- AlterTable
ALTER TABLE "cloud_wallet_user_info" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxSubWallets" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "useCount" INTEGER NOT NULL DEFAULT 0;
