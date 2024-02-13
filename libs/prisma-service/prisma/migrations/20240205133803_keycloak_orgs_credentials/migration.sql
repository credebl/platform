-- AlterTable
ALTER TABLE "organisation" ADD COLUMN     "clientId" VARCHAR(500),
ADD COLUMN     "clientSecret" VARCHAR(500),
ADD COLUMN     "idpId" VARCHAR(500);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "keycloakUserId" VARCHAR(500);
