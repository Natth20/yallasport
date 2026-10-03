'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { isEntityId, isDeskPageRef } from '@/lib/security/http';
import { swallow } from '@/lib/ops/caught';
import { isAdPlacementId, isAdsenseSlotId, isSafeAdHtml, isSafeAdHref } from '@/lib/ads/catalog';

const adRoles = new Set(['SUPER_ADMIN', 'ADS_MANAGER']);

function bumpAds() {
  revalidateTag('ads', 'max');
  revalidatePath('/', 'layout');
  revalidatePath('/admin/ads');
  revalidatePath('/ar/admin/ads');
  revalidatePath('/en/admin/ads');
}

async function requireAdsAdmin() {
  const session = await auth();
  if (!session?.user?.role || !adRoles.has(session.user.role)) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function toggleAdSlot(formData: FormData) {
  const session = await requireAdsAdmin();
  const id = String(formData.get('id') || '');
  if (!isEntityId(id)) return;

  const slot = await prisma.adSlot.findUnique({ where: { id }, select: { isActive: true } });
  if (!slot) return;

  await prisma.adSlot.update({
    where: { id },
    data: { isActive: !slot.isActive },
  });
  if (session.user.id) {
    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: slot.isActive ? 'AD_SLOT_OFF' : 'AD_SLOT_ON',
          entityType: 'AdSlot',
          entityId: id,
        },
      })
      .catch(swallow('src/app/[locale]/admin/ads/actions.ts:toggle', undefined));
  }
  bumpAds();
}

export async function saveAdSlot(formData: FormData) {
  await requireAdsAdmin();
  const id = String(formData.get('id') || '');
  if (!isEntityId(id)) return;

  const headline = String(formData.get('headline') || '').trim().slice(0, 160) || null;
  const imageUrlRaw = String(formData.get('imageUrl') || '').trim();
  const linkUrlRaw = String(formData.get('linkUrl') || '').trim();
  const htmlRaw = String(formData.get('html') || '').trim();
  const adsenseRaw = String(formData.get('adsenseSlot') || '').trim();

  const imageUrl = imageUrlRaw && isSafeAdHref(imageUrlRaw) ? imageUrlRaw : null;
  const linkUrl = linkUrlRaw && (isDeskPageRef(linkUrlRaw) || isSafeAdHref(linkUrlRaw)) ? linkUrlRaw : null;
  const html = htmlRaw && isSafeAdHtml(htmlRaw) ? htmlRaw : null;
  const adsenseSlot = isAdsenseSlotId(adsenseRaw) ? adsenseRaw : null;

  await prisma.adSlot.update({
    where: { id },
    data: { headline, imageUrl, linkUrl, html, adsenseSlot },
  });
  bumpAds();
}

export async function ensureAdCatalog() {
  await requireAdsAdmin();
  const { AD_PLACEMENTS } = await import('@/lib/ads/catalog');
  for (const row of AD_PLACEMENTS) {
    if (!isAdPlacementId(row.id)) continue;
    await prisma.adSlot.upsert({
      where: { placement: row.id },
      update: {},
      create: { placement: row.id, isActive: false, headline: row.ar, linkUrl: '/contact' },
    });
  }
  bumpAds();
}
