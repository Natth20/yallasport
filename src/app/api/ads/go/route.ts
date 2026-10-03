import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isEntityId } from '@/lib/security/http';
import { isSafeAdHref } from '@/lib/ads/catalog';
import { swallow } from '@/lib/ops/caught';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!isEntityId(id)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const slot = await prisma.adSlot.findUnique({
    where: { id },
    select: { isActive: true, linkUrl: true },
  });
  if (!slot?.isActive || !isSafeAdHref(slot.linkUrl)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  await prisma.adSlot
    .update({
      where: { id },
      data: { clicks: { increment: 1 } },
    })
    .catch(swallow('ads.click', null, { persist: false }));

  return NextResponse.redirect(slot.linkUrl as string);
}
