CREATE UNIQUE INDEX intent_templates_unique_org
ON intent_templates ("orgId", "intentId", "templateId")
WHERE "orgId" IS NOT NULL;

CREATE UNIQUE INDEX intent_templates_unique_no_org
ON intent_templates ("intentId", "templateId")
WHERE "orgId" IS NULL;