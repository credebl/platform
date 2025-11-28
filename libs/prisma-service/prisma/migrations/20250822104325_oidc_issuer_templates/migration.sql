-- Drop the table if it exists (safe for dev)
DROP TABLE IF EXISTS "public"."credential_templates";

-- Create table
CREATE TABLE "public"."credential_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "canBeRevoked" BOOLEAN NOT NULL DEFAULT false,
    "attributes" JSON NOT NULL,
    "appearance" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "credential_templates_pkey" PRIMARY KEY ("id")
);
