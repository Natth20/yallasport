ALTER TABLE "Coach" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "Coach"
SET "slug" = 'coach-' || "id"
WHERE "slug" IS NULL OR "slug" = '';
CREATE UNIQUE INDEX IF NOT EXISTS "Coach_slug_key" ON "Coach"("slug");
