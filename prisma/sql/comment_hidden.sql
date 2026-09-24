ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Comment_hiddenAt_idx" ON "Comment" ("hiddenAt");
