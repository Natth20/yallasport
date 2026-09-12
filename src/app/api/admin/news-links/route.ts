import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

const EDITOR_ROLES = ['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR'];

export const POST = auth(async function POST(req) {
  const role = req.auth?.user?.role;
  if (!req.auth?.user?.id || !role || !EDITOR_ROLES.includes(role)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const newsId = typeof body?.newsId === 'string' ? body.newsId : '';
  const entityType = typeof body?.entityType === 'string' ? body.entityType : '';
  const entityId = typeof body?.entityId === 'string' ? body.entityId : '';
  const confirmed = Boolean(body?.confirmed);

  if (!newsId || !entityType || !entityId) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const link = await prisma.newsEntityLink.upsert({
    where: {
      newsId_entityType_entityId: { newsId, entityType, entityId }
    },
    update: { confirmed, suggested: false },
    create: { newsId, entityType, entityId, confirmed, suggested: !confirmed }
  });

  await prisma.auditLog.create({
    data: {
      userId: req.auth.user.id,
      action: confirmed ? 'NEWS_ENTITY_CONFIRM' : 'NEWS_ENTITY_UNLINK',
      entityType: 'NewsEntityLink',
      entityId: link.id
    }
  });

  return NextResponse.json({ ok: true, link });
});
