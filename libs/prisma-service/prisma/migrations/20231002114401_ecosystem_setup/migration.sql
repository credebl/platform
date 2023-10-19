-- CreateTable
CREATE TABLE "ecosystem_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ecosystemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ecosystemId" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecosystem_orgs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ecosystemId" TEXT NOT NULL,
    "ecosystemRoleId" INTEGER NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "ecosystem_orgs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ecosystem_roles_name_key" ON "ecosystem_roles"("name");

-- AddForeignKey
ALTER TABLE "ecosystem_invitations" ADD CONSTRAINT "ecosystem_invitations_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_users" ADD CONSTRAINT "ecosystem_users_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_ecosystemId_fkey" FOREIGN KEY ("ecosystemId") REFERENCES "ecosystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecosystem_orgs" ADD CONSTRAINT "ecosystem_orgs_ecosystemRoleId_fkey" FOREIGN KEY ("ecosystemRoleId") REFERENCES "ecosystem_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
