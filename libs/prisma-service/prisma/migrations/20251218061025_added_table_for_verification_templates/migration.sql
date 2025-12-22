-- CreateTable
CREATE TABLE "verification_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "templateJson" JSONB NOT NULL,
    "orgId" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,
    "signerOption" "SignerOption" NOT NULL,

    CONSTRAINT "verification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intents" (
    "id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,

    CONSTRAINT "intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intent_templates" (
    "id" UUID NOT NULL,
    "orgId" UUID,
    "intentId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "createDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastChangedDateTime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedBy" UUID NOT NULL,

    CONSTRAINT "intent_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_templates_orgId_idx" ON "verification_templates"("orgId");

-- CreateIndex
CREATE INDEX "intent_templates_orgId_idx" ON "intent_templates"("orgId");

-- CreateIndex
CREATE INDEX "intent_templates_intentId_idx" ON "intent_templates"("intentId");

-- CreateIndex
CREATE INDEX "intent_templates_templateId_idx" ON "intent_templates"("templateId");

-- AddForeignKey
ALTER TABLE "verification_templates" ADD CONSTRAINT "verification_templates_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_templates" ADD CONSTRAINT "intent_templates_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_templates" ADD CONSTRAINT "intent_templates_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_templates" ADD CONSTRAINT "intent_templates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "verification_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
