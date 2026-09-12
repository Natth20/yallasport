import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { getTranslationProvider } from '@/lib/i18n/translation-provider';

const EDITOR_ROLES = ['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR'];

export const POST = auth(async function POST(req) {
  const role = req.auth?.user?.role;
  if (!req.auth?.user?.id || !role || !EDITOR_ROLES.includes(role)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (action === 'backfill') {
    const { backfillTranslations } = await import('@/lib/i18n/backfill');
    const result = await backfillTranslations(req.auth.user.id);
    return NextResponse.json(result);
  }

  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id || !['approve', 'reject', 'retranslate'].includes(action || '')) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const translation = await prisma.newsTranslation.findUnique({ where: { id } });
  if (!translation) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (action === 'approve' || action === 'reject') {
    const updated = await prisma.newsTranslation.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewerId: req.auth.user.id,
        reviewedAt: new Date(),
        source: 'EDITORIAL'
      }
    });
    await prisma.auditLog.create({
      data: {
        userId: req.auth.user.id,
        action: action === 'approve' ? 'TRANSLATION_APPROVE' : 'TRANSLATION_REJECT',
        entityType: 'NewsTranslation',
        entityId: id
      }
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  const news = await prisma.news.findUnique({ where: { id: translation.newsId } });
  if (!news) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const provider = getTranslationProvider();
  const draft = await provider.translate({
    sourceLocale: news.sourceLocale || 'ar',
    targetLocale: translation.locale,
    title: news.title,
    excerpt: news.excerpt,
    content: news.content
  });
  if (!draft) {
    return NextResponse.json({ error: 'provider_unconfigured' }, { status: 503 });
  }
  const updated = await prisma.newsTranslation.update({
    where: { id },
    data: {
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      status: 'DRAFT',
      source: 'MACHINE',
      providerKey: draft.providerKey,
      reviewerId: null,
      reviewedAt: null
    }
  });
  return NextResponse.json({ ok: true, status: updated.status });
});
