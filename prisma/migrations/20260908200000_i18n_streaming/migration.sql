-- i18n translations, news entity links, and licensed stream assets
ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "sourceLocale" TEXT NOT NULL DEFAULT 'ar';

CREATE TABLE IF NOT EXISTS "NewsTranslation" (
  "id" TEXT PRIMARY KEY,
  "newsId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "source" TEXT NOT NULL DEFAULT 'MACHINE',
  "providerKey" TEXT,
  "reviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsTranslation_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsTranslation_newsId_locale_key" ON "NewsTranslation"("newsId", "locale");
CREATE INDEX IF NOT EXISTS "NewsTranslation_locale_status_idx" ON "NewsTranslation"("locale", "status");

CREATE TABLE IF NOT EXISTS "EntityTranslation" (
  "id" TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "source" TEXT NOT NULL DEFAULT 'MACHINE',
  "providerKey" TEXT,
  "reviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "EntityTranslation_entityType_entityId_locale_key" ON "EntityTranslation"("entityType", "entityId", "locale");
CREATE INDEX IF NOT EXISTS "EntityTranslation_entityType_locale_status_idx" ON "EntityTranslation"("entityType", "locale", "status");

CREATE TABLE IF NOT EXISTS "NewsEntityLink" (
  "id" TEXT PRIMARY KEY,
  "newsId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "suggested" BOOLEAN NOT NULL DEFAULT TRUE,
  "confirmed" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsEntityLink_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsEntityLink_newsId_entityType_entityId_key" ON "NewsEntityLink"("newsId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "NewsEntityLink_entityType_entityId_confirmed_idx" ON "NewsEntityLink"("entityType", "entityId", "confirmed");

CREATE TABLE IF NOT EXISTS "StreamAsset" (
  "id" TEXT PRIMARY KEY,
  "providerKey" TEXT NOT NULL,
  "externalAssetId" TEXT NOT NULL,
  "protocol" TEXT NOT NULL,
  "drmType" TEXT NOT NULL DEFAULT 'NONE',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "matchId" TEXT,
  "channelId" TEXT,
  "episodeId" TEXT,
  "licenseId" TEXT,
  "geoAllow" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "entitlementTier" TEXT NOT NULL DEFAULT 'FREE',
  "apiCredentialsRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StreamAsset_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "StreamAsset_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "StreamAsset_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "StreamAsset_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "StreamAsset_providerKey_externalAssetId_key" ON "StreamAsset"("providerKey", "externalAssetId");
CREATE INDEX IF NOT EXISTS "StreamAsset_status_startsAt_idx" ON "StreamAsset"("status", "startsAt");
CREATE INDEX IF NOT EXISTS "StreamAsset_matchId_status_idx" ON "StreamAsset"("matchId", "status");
CREATE INDEX IF NOT EXISTS "StreamAsset_channelId_status_idx" ON "StreamAsset"("channelId", "status");
