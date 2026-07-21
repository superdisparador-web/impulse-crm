-- Enforce uniqueness for active (non-soft-deleted) organizations only.
-- These partial indexes preserve the ability to recreate an organization after soft delete.
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_document_active_unique"
ON "Organization" ("document")
WHERE "deletedAt" IS NULL AND "document" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_email_active_unique"
ON "Organization" (LOWER("email"))
WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;
