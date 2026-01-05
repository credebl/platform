-- CreateTable
CREATE TABLE "ecosystem" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,
    "deletedAt" TIMESTAMP(6),
    "logoUrl" TEXT,
    "autoEndorsement" BOOLEAN NOT NULL DEFAULT false,
    "ledgers" JSONB,

    CONSTRAINT "ecosystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_users" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ecosystemId" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_orgs" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "deploymentMode" TEXT,
    "ecosystemId" UUID NOT NULL,
    "ecosystemRoleId" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_orgs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_invitations" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" UUID,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,

    CONSTRAINT "ecosystem_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ecosystem_roles_name_key" ON "ecosystem_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ecosystem_users_userId_ecosystemId_key" ON "ecosystem_users"("userId", "ecosystemId");

-- CreateIndex
CREATE UNIQUE INDEX "ecosystem_orgs_orgId_ecosystemId_key" ON "ecosystem_orgs"("orgId", "ecosystemId");

-- AddForeignKey
ALTER TABLE "ecosystem_users" ADD CONSTRAINT "ecosystem_users_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_users" ADD CONSTRAINT "ecosystem_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_ecosystemRoleId_fkey" FOREIGN KEY ("ecosystemRoleId") REFERENCES "ecosystem_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_invitations" ADD CONSTRAINT "ecosystem_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
