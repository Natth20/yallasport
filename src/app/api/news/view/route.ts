import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ratelimit } from '@/lib/redis';
import { clientIp } from '@/lib/security/http';

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { success } = await ratelimit.limit(`news_view_${ip}`);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id || id.length > 80) return NextResponse.json({ ok: false }, { status: 400 });

  const updated = await prisma.news
    .updateMany({
      where: { id, status: 'PUBLISHED' },
      data: { views: { increment: 1 } },
    })
    .catch(() => null);

  if (!updated?.count) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true });
}
