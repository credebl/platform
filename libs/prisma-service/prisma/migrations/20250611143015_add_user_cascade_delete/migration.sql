-- DropForeignKey
ALTER TABLE "user_org_roles" DROP CONSTRAINT "user_org_roles_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_role_mapping" DROP CONSTRAINT "user_role_mapping_userId_fkey";

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_mapping" ADD CONSTRAINT "user_role_mapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
