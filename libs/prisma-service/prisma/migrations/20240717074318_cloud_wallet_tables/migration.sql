-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DEFAULT_USER', 'HOLDER');

-- CreateEnum
CREATE TYPE "CloudWalletType" AS ENUM ('CLOUD_BASE_WALLET', 'CLOUD_SUB_WALLET');

-- CreateTable
CREATE TABLE "user_role" (
    "id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_mapping" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userRoleId" UUID NOT NULL,

    CONSTRAINT "user_role_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_wallet_user_info" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" VARCHAR(500),
    "type" "CloudWalletType" NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "cloud_wallet_user_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cloud_wallet_user_info_email_key" ON "cloud_wallet_user_info"("email");

-- AddForeignKey
ALTER TABLE "user_role_mapping" ADD CONSTRAINT "user_role_mapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_mapping" ADD CONSTRAINT "user_role_mapping_userRoleId_fkey" FOREIGN KEY ("userRoleId") REFERENCES "user_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud_wallet_user_info" ADD CONSTRAINT "cloud_wallet_user_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
