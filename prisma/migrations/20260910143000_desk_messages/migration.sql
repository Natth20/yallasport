-- CreateEnum
CREATE TYPE "DeskChannel" AS ENUM ('REPORT', 'CONTACT');

-- CreateEnum
CREATE TYPE "DeskStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DeskMessage" (
    "id" TEXT NOT NULL,
    "channel" "DeskChannel" NOT NULL,
    "kind" TEXT NOT NULL,
    "pageUrl" TEXT,
    "details" TEXT NOT NULL,
    "replyEmail" TEXT,
    "locale" TEXT,
    "userId" TEXT,
    "status" "DeskStatus" NOT NULL DEFAULT 'NEW',
    "emailSentAt" TIMESTAMP(3),
    "emailSkip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "DeskMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeskMessage_status_createdAt_idx" ON "DeskMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DeskMessage_channel_createdAt_idx" ON "DeskMessage"("channel", "createdAt");

-- AddForeignKey
ALTER TABLE "DeskMessage" ADD CONSTRAINT "DeskMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
