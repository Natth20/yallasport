CREATE TABLE IF NOT EXISTS "Sport" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "officialName" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO "Sport" ("id", "slug", "officialName", "name")
VALUES ('sport_football', 'football', 'Association football', 'Football')
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "officialName" TEXT;
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "sportId" TEXT;
UPDATE "League" SET "officialName" = "name" WHERE "officialName" IS NULL OR "officialName" = '';
UPDATE "League" SET "sportId" = 'sport_football' WHERE "sportId" IS NULL;

ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "officialName" TEXT;
UPDATE "Team" SET "officialName" = "name" WHERE "officialName" IS NULL OR "officialName" = '';

ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "officialName" TEXT;
UPDATE "Player" SET "officialName" = "name" WHERE "officialName" IS NULL OR "officialName" = '';

ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "sportId" TEXT;
UPDATE "Match" SET "sportId" = 'sport_football' WHERE "sportId" IS NULL;

CREATE TABLE IF NOT EXISTS "CompetitionSeason" (
  "id" TEXT PRIMARY KEY,
  "leagueId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "officialName" TEXT,
  "startsAt" TIMESTAMP,
  "endsAt" TIMESTAMP,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionSeason_leagueId_year_key" ON "CompetitionSeason" ("leagueId", "year");

CREATE TABLE IF NOT EXISTS "SportEvent" (
  "id" TEXT PRIMARY KEY,
  "sportId" TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "seasonYear" INTEGER NOT NULL,
  "matchId" TEXT NOT NULL UNIQUE,
  "kickoffAt" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "SportEvent_sportId_kickoffAt_idx" ON "SportEvent" ("sportId", "kickoffAt");
CREATE INDEX IF NOT EXISTS "SportEvent_competitionId_seasonYear_idx" ON "SportEvent" ("competitionId", "seasonYear");

CREATE TABLE IF NOT EXISTS "ApiProvider" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "quotaLimit" INTEGER,
  "quotaRemaining" INTEGER,
  "quotaResetAt" TIMESTAMP,
  "lastError" TEXT,
  "lastSuccessAt" TIMESTAMP
);

INSERT INTO "ApiProvider" ("id", "key", "name", "baseUrl")
VALUES
  ('prov_apisports', 'apisports', 'API-Sports Football', 'https://v3.football.api-sports.io'),
  ('prov_rapidapi', 'rapidapi', 'API-Football RapidAPI', 'https://api-football-v1.p.rapidapi.com/v3')
ON CONFLICT ("key") DO NOTHING;

CREATE TABLE IF NOT EXISTS "ApiRequestLog" (
  "id" TEXT PRIMARY KEY,
  "providerId" TEXT,
  "providerKey" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "status" INTEGER,
  "outcome" TEXT NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ApiRequestLog_providerKey_createdAt_idx" ON "ApiRequestLog" ("providerKey", "createdAt");
CREATE INDEX IF NOT EXISTS "ApiRequestLog_outcome_createdAt_idx" ON "ApiRequestLog" ("outcome", "createdAt");
