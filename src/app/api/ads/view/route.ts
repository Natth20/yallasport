import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isEntityId } from '@/lib/security/http';
import { swallow } from '@/lib/ops/caught';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = String(body?.id || '');
  if (!isEntityId(id)) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.adSlot
    .update({
      where: { id },
      data: { impressions: { increment: 1 } },
    })
    .catch(swallow('ads.view', null, { persist: false }));

  return NextResponse.json({ ok: true });
}
