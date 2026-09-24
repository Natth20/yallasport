-- YouTube clip desk (highlights / shorts). Separate from licensed streaming.

CREATE TYPE "YoutubeClipKind" AS ENUM ('VIDEO', 'SHORT');
CREATE TYPE "YoutubeClipStatus" AS ENUM ('PUBLISHED', 'ARCHIVED');

CREATE TABLE "YoutubeClip" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "kind" "YoutubeClipKind" NOT NULL DEFAULT 'VIDEO',
    "status" "YoutubeClipStatus" NOT NULL DEFAULT 'PUBLISHED',
    "durationSec" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YoutubeClip_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "YoutubeClip_youtubeId_key" ON "YoutubeClip"("youtubeId");
CREATE INDEX "YoutubeClip_status_kind_publishedAt_idx" ON "YoutubeClip"("status", "kind", "publishedAt");
CREATE INDEX "YoutubeClip_channelId_publishedAt_idx" ON "YoutubeClip"("channelId", "publishedAt");
