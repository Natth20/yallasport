-- Persist API-Football transfers on the desk ledger.

ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "playerExternalId" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "fromLogo" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "toLogo" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "fromTeamId" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "toTeamId" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Transfer_externalId_key" ON "Transfer"("externalId");
CREATE INDEX IF NOT EXISTS "Transfer_date_idx" ON "Transfer"("date");
CREATE INDEX IF NOT EXISTS "Transfer_toTeam_idx" ON "Transfer"("toTeam");
