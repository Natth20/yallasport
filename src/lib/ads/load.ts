import { unstable_noStore as noStore, unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { AD_PLACEMENTS, type AdPlacementId, type PublicAdSlot } from '@/lib/ads/catalog';

let ensurePromise: Promise<void> | null = null;

async function ensureDefaultSlots() {
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    try {
      for (const row of AD_PLACEMENTS) {
        await prisma.adSlot.upsert({
          where: { placement: row.id },
          update: {},
          create: {
            placement: row.id,
            isActive: false,
            headline: row.ar,
            linkUrl: '/contact',
          },
        });
      }
    } catch (err) {
      console.warn('[ads.ensure]', err instanceof Error ? err.message : err);
    } finally {
      ensurePromise = null;
    }
  })();
  return ensurePromise;
}

const readAllSlots = unstable_cache(
  async () => {
    try {
      return await prisma.adSlot.findMany({
        where: { isActive: true },
        orderBy: { placement: 'asc' },
        select: {
          id: true,
          placement: true,
          isActive: true,
          impressions: true,
          clicks: true,
          headline: true,
          imageUrl: true,
          linkUrl: true,
          html: true,
          adsenseSlot: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      console.warn('[ads.readAllSlots]', err instanceof Error ? err.message : err);
      return [];
    }
  },
  ['ads-active-slots-v2'],
  { tags: ['ads'], revalidate: 60 },
);

export async function listAdSlotsForAdmin() {
  noStore();
  await ensureDefaultSlots();
  return prisma.adSlot.findMany({
    orderBy: { placement: 'asc' },
  });
}

export async function getActiveAd(placement: AdPlacementId): Promise<PublicAdSlot | null> {
  try {
    const rows = await readAllSlots().catch(swallow('ads.read', [], { persist: false }));
    const slot = rows.find((row) => row.placement === placement);
    if (!slot?.isActive) return null;
    return {
      id: slot.id,
      placement: slot.placement,
      isActive: true,
      headline: slot.headline,
      imageUrl: slot.imageUrl,
      linkUrl: slot.linkUrl,
      html: slot.html,
      adsenseSlot: slot.adsenseSlot,
    };
  } catch {
    return null;
  }
}
