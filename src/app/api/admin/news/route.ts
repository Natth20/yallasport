import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { enqueueNewsTranslation } from '@/lib/i18n/backfill';
import { resolveNewsImage } from '@/lib/news/enrich-source';
import { isProtectedFullTextSource } from '@/lib/news/import-copy';
import { pushProvenance } from '@/lib/news/provenance';
import { readingTimeMinutes } from '@/lib/news/reading-time';
import { isEditorialNewsItem, isTrustedNewsUrl } from '@/lib/news/trusted-sources';
import { prisma } from '@/lib/prisma';

const EDITOR_ROLES = ['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR'];

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asBool(value: unknown) {
  return value === true || value === 'true';
}

function asDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const POST = auth(async function POST(req) {
  if (!req.auth || !EDITOR_ROLES.includes((req.auth.user as { role?: string })?.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(swallow("src/app/api/admin/news/route.ts:32", null, { persist: false }));
  const id = asString(body?.id);
  const action = asString(body?.action);
  const userId = (req.auth.user as { id?: string }).id;

  if (!action) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (action === 'enrich-images') {
    const rows = await prisma.news.findMany({
      where: {
        OR: [{ featuredImage: null }, { featuredImage: '' }, { ogImage: null }, { ogImage: '' }],
        sourceUrl: { not: null },
        status: { in: ['PENDING_REVIEW', 'PUBLISHED', 'DRAFT'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
      select: {
        id: true,
        featuredImage: true,
        ogImage: true,
        content: true,
        sourceUrl: true,
        provenance: true,
      },
    });

    let updated = 0;
    for (const row of rows) {
      if (row.featuredImage?.trim() || row.ogImage?.trim()) continue;
      const image = await resolveNewsImage({
        content: row.content,
        sourceUrl: row.sourceUrl,
      });
      if (!image) continue;
      await prisma.news.update({
        where: { id: row.id },
        data: {
          featuredImage: image,
          ogImage: image,
          provenance: pushProvenance(row.provenance, {
            userId,
            action: 'NEWS_ENRICH_IMAGE',
            image,
            aiAssisted: false,
          }),
        },
      });
      updated += 1;
    }

    return NextResponse.json({
      success: true,
      scanned: rows.length,
      updated,
      message: `Enriched ${updated} of ${rows.length} stories`,
    });
  }

  if (!id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'reject') {
    const updated = await prisma.news.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        provenance: pushProvenance(news.provenance, {
          userId,
          action: 'NEWS_REJECT',
          aiAssisted: false,
        }),
      },
    });
    return NextResponse.json({ success: true, status: updated.status });
  }

  if (action === 'approve') {
    if (!isTrustedNewsUrl(news.sourceUrl) || !isEditorialNewsItem(news.title, news.content)) {
      return NextResponse.json(
        { error: 'Only editorial reports from trusted sources can be published' },
        { status: 400 }
      );
    }

    const image =
      news.featuredImage ||
      news.ogImage ||
      (await resolveNewsImage({
        content: news.excerpt || news.content,
        sourceUrl: news.sourceUrl,
      }));

    const now = new Date();
    const schedule = asDate(body?.publishAt) || news.publishAt;
    const goLiveAt = schedule && schedule.getTime() > now.getTime() ? schedule : news.publishedAt || now;

    const updated = await prisma.news.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: goLiveAt,
        publishAt: schedule,
        editorId: userId || news.editorId,
        featuredImage: image || news.featuredImage,
        ogImage: image || news.ogImage,
        readingTime: readingTimeMinutes(`${news.excerpt || ''} ${news.content}`),
        provenance: pushProvenance(news.provenance, {
          userId,
          action: 'NEWS_APPROVE',
          image: image || null,
          scheduled: Boolean(schedule && schedule.getTime() > now.getTime()),
          publishAt: schedule?.toISOString() || null,
          aiAssisted: false,
          fullTextCopied: false,
        }),
      },
    });
    await enqueueNewsTranslation(updated.id);
    return NextResponse.json({
      success: true,
      status: updated.status,
      image: image || null,
      publishedAt: updated.publishedAt,
    });
  }

  if (action === 'save') {
    const title = asString(body?.title) || news.title;
    const excerpt = asString(body?.excerpt);
    const content = asString(body?.content) || news.content;
    const category = asString(body?.category) || news.category;
    const sourceName = asString(body?.sourceName);
    const sourceUrl = asString(body?.sourceUrl) || news.sourceUrl || '';
    const featuredImage = asString(body?.featuredImage);
    const ogImage = asString(body?.ogImage) || featuredImage;
    const tagsRaw = asString(body?.tags);
    const tags = tagsRaw
      ? tagsRaw.split(/[,،]/).map((tag) => tag.trim()).filter(Boolean)
      : news.tags;
    const status = asString(body?.status);
    const allowedStatus = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'];
    const nextStatus = allowedStatus.includes(status) ? status : news.status;

    if (sourceUrl && !isTrustedNewsUrl(sourceUrl)) {
      return NextResponse.json({ error: 'sourceUrl must be a trusted news host' }, { status: 400 });
    }
    if (!isEditorialNewsItem(title, content)) {
      return NextResponse.json({ error: 'Content does not look like an editorial news report' }, { status: 400 });
    }

    let image = featuredImage || ogImage || news.featuredImage || news.ogImage || null;
    if (!image && asBool(body?.fetchImage)) {
      image = await resolveNewsImage({ content, sourceUrl });
    }

    const now = new Date();
    const schedule = asDate(body?.publishAt) || news.publishAt;
    const readingTime = readingTimeMinutes(`${excerpt} ${content}`);
    const publishedAt =
      nextStatus === 'PUBLISHED'
        ? schedule && schedule.getTime() > now.getTime()
          ? schedule
          : news.publishedAt || now
        : news.publishedAt;

    const updated = await prisma.news.update({
      where: { id },
      data: {
        title,
        excerpt: excerpt || null,
        content,
        category,
        sourceName: sourceName || null,
        sourceUrl: sourceUrl || null,
        featuredImage: image,
        ogImage: image,
        tags,
        featured: asBool(body?.featured),
        breaking: asBool(body?.breaking),
        isPremium: asBool(body?.isPremium),
        status: nextStatus as typeof news.status,
        publishedAt,
        publishAt: schedule,
        editorId: userId || news.editorId,
        readingTime,
        provenance: pushProvenance(news.provenance, {
          userId,
          action: 'NEWS_SAVE',
          status: nextStatus,
          aiAssisted: false,
          publishAt: schedule?.toISOString() || null,
        }),
      },
    });
    if (nextStatus === 'PUBLISHED') {
      await enqueueNewsTranslation(updated.id);
    }

    return NextResponse.json({
      success: true,
      id: updated.id,
      status: updated.status,
      featuredImage: updated.featuredImage,
    });
  }

  if (action === 'enrich-one') {
    const image = await resolveNewsImage({
      featuredImage: news.featuredImage,
      ogImage: news.ogImage,
      content: news.content,
      sourceUrl: news.sourceUrl,
    });
    if (!image) {
      return NextResponse.json({ error: 'No image found on the source page' }, { status: 404 });
    }
    const updated = await prisma.news.update({
      where: { id },
      data: {
        featuredImage: image,
        ogImage: image,
        provenance: pushProvenance(news.provenance, {
          userId,
          action: 'NEWS_ENRICH_IMAGE',
          image,
          aiAssisted: false,
        }),
      },
    });
    return NextResponse.json({ success: true, featuredImage: updated.featuredImage });
  }

  if (action === 'enrich-body') {
    return NextResponse.json(
      {
        error: isProtectedFullTextSource(news.sourceUrl)
          ? 'Full text from BBC, Sky Sports, and Reuters is not stored. Keep title, excerpt, and the source link.'
          : 'Full-source scrapes are disabled. Write original desk copy or keep the excerpt and source link.',
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
});
