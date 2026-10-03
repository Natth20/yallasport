import { unstable_noStore as noStore, unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { AD_PLACEMENTS, type AdPlacementId, type PublicAdSlot } from '@/lib/ads/catalog';

async function ensureDefaultSlots() {
  await Promise.all(
    AD_PLACEMENTS.map((row) =>
      prisma.adSlot.upsert({
        where: { placement: row.id },
        update: {},
        create: {
          placement: row.id,
          isActive: false,
          headline: row.ar,
          linkUrl: '/contact',
        },
      }),
    ),
  ).catch(swallow('ads.ensure', undefined, { persist: false }));
}

const readAllSlots = unstable_cache(
  async () => {
    return prisma.adSlot.findMany({
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
  },
  ['ads-all-slots-v1'],
  { tags: ['ads'], revalidate: 5 },
);

export async function listAdSlotsForAdmin() {
  noStore();
  await ensureDefaultSlots();
  return prisma.adSlot.findMany({
    orderBy: { placement: 'asc' },
  });
}

export async function getActiveAd(placement: AdPlacementId): Promise<PublicAdSlot | null> {
  let rows = await readAllSlots().catch(swallow('ads.read', [], { persist: false }));
  if (rows.length === 0) {
    await ensureDefaultSlots();
    rows = await prisma.adSlot
      .findMany({
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
      })
      .catch(swallow('ads.read.fallback', [], { persist: false }));
  }
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
}
