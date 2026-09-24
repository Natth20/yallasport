CREATE TABLE IF NOT EXISTS "MatchReaction" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MatchReaction_matchId_emoji_key" ON "MatchReaction"("matchId", "emoji");
CREATE INDEX IF NOT EXISTS "MatchReaction_matchId_idx" ON "MatchReaction"("matchId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MatchReaction_matchId_fkey'
  ) THEN
    ALTER TABLE "MatchReaction"
      ADD CONSTRAINT "MatchReaction_matchId_fkey"
      FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
