-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "firstName" VARCHAR(500),
    "lastName" VARCHAR(500),
    "email" VARCHAR(500),
    "username" VARCHAR(500),
    "verificationCode" VARCHAR(500),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "supabaseUserId" VARCHAR(500),
    "clientId" VARCHAR(500),
    "clientSecret" VARCHAR(500),
    "profileImg" TEXT,
    "fidoUserId" VARCHAR(1000),
    "isFidoVerified" BOOLEAN NOT NULL DEFAULT false,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orgId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "org_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_org_roles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orgRoleId" INTEGER NOT NULL,
    "orgId" INTEGER,

    CONSTRAINT "user_org_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR(500),
    "description" VARCHAR(500),
    "orgSlug" TEXT,
    "logoUrl" TEXT,
    "website" VARCHAR,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_invitations" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),
    "userId" INTEGER NOT NULL,
    "orgId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "orgRoles" INTEGER[],
    "email" TEXT,

    CONSTRAINT "org_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "devices" JSONB DEFAULT '[]',
    "credentialId" VARCHAR,
    "deviceFriendlyName" VARCHAR,
    "userId" INTEGER,
    "deletedAt" TIMESTAMP(6),
    "authCounter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" SERIAL NOT NULL,
    "externalIp" VARCHAR NOT NULL,
    "lastInternalId" VARCHAR NOT NULL,
    "username" VARCHAR NOT NULL,
    "sgApiKey" VARCHAR NOT NULL,
    "emailFrom" VARCHAR NOT NULL,
    "apiEndpoint" VARCHAR NOT NULL,
    "tailsFileServer" VARCHAR NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_agents" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "orgDid" VARCHAR NOT NULL,
    "verkey" VARCHAR NOT NULL,
    "agentEndPoint" VARCHAR NOT NULL,
    "agentId" INTEGER,
    "isDidPublic" BOOLEAN NOT NULL,
    "agentSpinUpStatus" INTEGER NOT NULL,
    "agentOptions" BYTEA,
    "walletName" VARCHAR,
    "tenantId" TEXT,
    "apiKey" TEXT,
    "agentsTypeId" INTEGER NOT NULL,
    "orgId" INTEGER NOT NULL,
    "orgAgentTypeId" INTEGER NOT NULL,
    "ledgerId" INTEGER
);

-- CreateTable
CREATE TABLE "org_agents_type" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "agent" VARCHAR(500) NOT NULL,

    CONSTRAINT "org_agents_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents_type" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "agent" VARCHAR(500) NOT NULL,

    CONSTRAINT "agents_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledgers" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR NOT NULL,
    "networkType" VARCHAR NOT NULL,
    "poolConfig" VARCHAR NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "networkString" VARCHAR NOT NULL,
    "registerDIDEndpoint" VARCHAR NOT NULL,
    "registerDIDPayload" JSONB
);

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "schema" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR NOT NULL,
    "version" VARCHAR NOT NULL,
    "attributes" TEXT NOT NULL,
    "schemaLedgerId" VARCHAR NOT NULL,
    "publisherDid" VARCHAR NOT NULL,
    "ledgerId" INTEGER NOT NULL DEFAULT 1,
    "issuerId" VARCHAR NOT NULL,
    "orgId" INTEGER NOT NULL,

    CONSTRAINT "PK_c9e7e648903a9e537347aba4372" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_definition" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "credentialDefinitionId" VARCHAR NOT NULL,
    "tag" VARCHAR NOT NULL,
    "schemaLedgerId" VARCHAR NOT NULL,
    "schemaId" INTEGER NOT NULL DEFAULT 1,
    "orgId" INTEGER NOT NULL DEFAULT 1,
    "revocable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_c9e7e648903a9e537347aba4373" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortening_url" (
    "id" SERIAL NOT NULL,
    "referenceId" VARCHAR(50),
    "url" TEXT,
    "type" TEXT,

    CONSTRAINT "shortening_url_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_invitations" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL DEFAULT 1,
    "agentId" INTEGER NOT NULL DEFAULT 1,
    "connectionInvitation" TEXT NOT NULL,
    "multiUse" BOOLEAN NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "connections" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "connectionId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "orgDid" TEXT NOT NULL,
    "theirLabel" TEXT NOT NULL,
    "autoAcceptConnection" BOOLEAN NOT NULL,
    "outOfBandId" TEXT NOT NULL,
    "orgId" INTEGER NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "connectionId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL,
    "credentialAttributes" JSONB[],
    "orgId" INTEGER NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presentations" (
    "id" SERIAL NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 1,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" INTEGER NOT NULL DEFAULT 1,
    "connectionId" TEXT NOT NULL,
    "state" TEXT,
    "threadId" TEXT,
    "isVerified" BOOLEAN,
    "orgId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e22" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "org_roles_name_key" ON "org_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_orgSlug_key" ON "organisation"("orgSlug");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_7c903f5e362fe8fd3d3edba17b5" ON "user_devices"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "org_agents_id_key" ON "org_agents"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ledgers_id_key" ON "ledgers"("id");

-- CreateIndex
CREATE UNIQUE INDEX "agents_id_key" ON "agents"("id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_invitations_id_key" ON "agent_invitations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_connectionId_key" ON "connections"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_connectionId_key" ON "credentials"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "presentations_id_key" ON "presentations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "presentations_connectionId_key" ON "presentations"("connectionId");

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "org_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_agentsTypeId_fkey" FOREIGN KEY ("agentsTypeId") REFERENCES "agents_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgAgentTypeId_fkey" FOREIGN KEY ("orgAgentTypeId") REFERENCES "org_agents_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_agents" ADD CONSTRAINT "org_agents_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema" ADD CONSTRAINT "schema_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_invitations" ADD CONSTRAINT "agent_invitations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "org_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
