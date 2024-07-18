-- DropForeignKey
ALTER TABLE "cloud_wallet_user_info" DROP CONSTRAINT "cloud_wallet_user_info_userId_fkey";

-- AlterTable
ALTER TABLE "cloud_wallet_user_info" ALTER COLUMN "label" DROP NOT NULL,
ALTER COLUMN "tenantId" DROP NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "cloud_wallet_user_info" ADD CONSTRAINT "cloud_wallet_user_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
