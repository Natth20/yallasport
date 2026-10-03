ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "headline" TEXT;
ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;
ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "html" TEXT;
ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "adsenseSlot" TEXT;
ALTER TABLE "AdSlot" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DELETE FROM "AdSlot" a
USING "AdSlot" b
WHERE a.ctid < b.ctid AND a."placement" = b."placement";

CREATE UNIQUE INDEX IF NOT EXISTS "AdSlot_placement_key" ON "AdSlot"("placement");
CREATE INDEX IF NOT EXISTS "AdSlot_isActive_placement_idx" ON "AdSlot"("isActive", "placement");
