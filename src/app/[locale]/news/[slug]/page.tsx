import type { Metadata } from 'next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ArrowUpRight, BookOpen, Calendar, Crown, Eye, ExternalLink, Lock, Newspaper, Radio, RefreshCw } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { JsonLd } from '@/components/seo/JsonLd';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { NewsAudioReader } from '@/components/news/NewsAudioReader';
import { NewsComments } from '@/components/news/NewsComments';
import { DeskRule, EditionPlate, EndMark, PhotoCorners, StorySpine } from '@/components/news/NewsOrnaments';
import { NewsReadingProgress } from '@/components/news/NewsReadingProgress';
import { NewsShareMenu } from '@/components/news/NewsShareMenu';
import { auth } from '@/lib/auth/auth';
import { canAccessPremiumContent } from '@/lib/auth/premium';
import { newsVisibleWhere, overlayNewsList, overlayNewsTranslation } from '@/lib/i18n/localized-content';
import { deskAuthorLabel, formatNewsHtml } from '@/lib/news/format-body';
import { wordCount } from '@/lib/news/fetch-article';
import { linkedEntitiesForNews } from '@/lib/news/entity-suggest';
import { linkContent } from '@/lib/news/linking';
import { displaySourceName, isTrustedNewsUrl } from '@/lib/news/trusted-sources';
import { publicStoryImage } from '@/lib/news/enrich-source';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const news = await prisma.news.findFirst({
    where: { AND: [{ slug }, newsVisibleWhere(locale)] },
  });
  const missing = pageMetadata({
    locale,
    title: pick(locale, 'خبر غير موجود', 'Story not found'),
    description: pick(locale, 'هذا الخبر غير متاح في يلا سبورت.', 'This story is not available on Yalla Sport.'),
    path: `/news/${slug}`,
    noIndex: true,
  });

  if (!news) return missing;

  const localized = await overlayNewsTranslation(news, locale);
  return pageMetadata({
    locale,
    title: localized.seoTitle || localized.title,
    description: localized.seoDescription || localized.excerpt || localized.title,
    path: `/news/${slug}`,
    images: [news.ogImage, news.featuredImage],
    type: 'article',
    publishedTime: news.publishedAt?.toISOString(),
    modifiedTime: news.updatedAt?.toISOString(),
  });
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug } = await params;
  const session = await auth();

  const news = await prisma.news.findFirst({
    where: { AND: [{ slug }, newsVisibleWhere(locale)] },
    include: {
      author: true,
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
        take: 80,
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });

  if (!news) notFound();
  if (!isTrustedNewsUrl(news.sourceUrl)) notFound();

  // Count real reads without blocking the page render.
  void prisma.news
    .update({
      where: { id: news.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => null);

  const localized = await overlayNewsTranslation(news, locale);
  const isPremium = localized.isPremium;
  const canAccess = canAccessPremiumContent({
    requiresPremium: isPremium,
    subscriptionStatus: session?.user?.subscriptionStatus,
    role: session?.user?.role,
  });

  const formattedBody = formatNewsHtml(localized.content || '');
  const linkedContent = await linkContent(formattedBody);
  const deskAuthor = deskAuthorLabel(news.author?.name, locale, pick);
  const sourceLabel = displaySourceName(news.sourceName, news.sourceUrl) || news.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source');
  const publishedLabel = news.publishedAt
    ? format(new Date(news.publishedAt), 'dd MMMM yyyy — HH:mm', { locale: locale === 'ar' ? ar : enUS })
    : pick(locale, 'غير منشور', 'Unpublished');
  const heroImage = publicStoryImage(news);

  const [relatedRaw, entityMap] = await Promise.all([
    prisma.news.findMany({
      where: {
        AND: [
          newsVisibleWhere(locale),
          { id: { not: news.id } },
          { category: news.category },
        ],
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        ogImage: true,
        category: true,
        publishedAt: true,
        readingTime: true,
        sourceName: true,
        sourceLocale: true,
      },
    }),
    linkedEntitiesForNews([news.id], locale),
  ]);

  const related = await overlayNewsList(relatedRaw, locale);
  const entities = entityMap.get(news.id) ?? [];
  const words = wordCount(localized.content || '');
  const updatedLabel = format(new Date(news.updatedAt), 'dd MMM yyyy — HH:mm', {
    locale: locale === 'ar' ? ar : enUS,
  });
  const facts = [
    {
      label: pick(locale, 'وقت القراءة', 'Read time'),
      value: `${news.readingTime || Math.max(1, Math.ceil(words / 200))} ${pick(locale, 'د', 'min')}`,
    },
    {
      label: pick(locale, 'الكلمات', 'Words'),
      value: String(words),
    },
    {
      label: pick(locale, 'المشاهدات', 'Views'),
      value: String(news.views + 1),
    },
    {
      label: pick(locale, 'آخر تحديث', 'Updated'),
      value: updatedLabel,
    },
  ];

  const newsSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: localized.title,
    image: heroImage || '/images/logo.jpg',
    datePublished: news.publishedAt?.toISOString() || news.createdAt.toISOString(),
    dateModified: news.updatedAt.toISOString(),
    author: [
      {
        '@type': 'Organization',
        name: sourceLabel,
      },
      {
        '@type': 'Organization',
        name: deskAuthor,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Yalla Sport',
    },
    isAccessibleForFree: !isPremium,
  };

  return (
    <article className="news-report ys-dossier-stack">
      <JsonLd data={newsSchema} />
      <NewsReadingProgress />
      <div className="news-flood" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="news-report-shell mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <StorySpine mark="Yalla Sport" folio={pick(locale, 'تقرير', 'Report')} />
        <div className="news-report-mast">
          <div className="flex flex-wrap items-center gap-3">
            <EditionPlate
              year={news.publishedAt ? news.publishedAt.getFullYear() : new Date().getFullYear()}
              label={pick(locale, 'تقرير', 'Report')}
            />
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground dark:text-foreground/45">
                <Link href="/news" className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-500 dark:text-orange-400">
                  <Newspaper className="h-3.5 w-3.5" />
                  {pick(locale, 'غرفة الأخبار', 'News desk')}
                </Link>
                <span aria-hidden>·</span>
                <span>{pick(locale, 'تقرير معتمد', 'Approved report')}</span>
              </div>
              <DeskRule className="max-w-[12rem]" />
            </div>
          </div>
          <TicketBarcode className="opacity-70" />
        </div>

        <header className="news-report-hero">
          <PhotoCorners />
          <span className="news-report-hero-folio" aria-hidden>
            YS
          </span>
          {heroImage ? (
            <div className="news-report-hero-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" />
            </div>
          ) : (
            <div className="news-report-hero-stage" aria-hidden>
              <PitchWatermark className="absolute inset-0 m-auto h-[55%] w-[55%] text-white/10" />
            </div>
          )}
          <div className="news-report-hero-wash" />
          <div className="news-report-hero-body">
            <div className="flex flex-wrap items-center gap-2">
              <span className="news-report-kicker">
                <Radio className="h-3.5 w-3.5" />
                {news.category}
              </span>
              {news.breaking ? (
                <span className="rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
                  {pick(locale, 'عاجل', 'Breaking')}
                </span>
              ) : null}
              {isPremium ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
                  <Crown className="h-3 w-3" />
                  {pick(locale, 'مميز', 'Premium')}
                </span>
              ) : null}
            </div>

            <h1 className="news-report-title">{localized.title}</h1>

            {localized.excerpt ? <p className="news-report-standfirst">{localized.excerpt}</p> : null}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/55">
              <span>
                {pick(locale, 'المصدر', 'Source')}: {sourceLabel}
              </span>
              <span aria-hidden>·</span>
              <span>
                {pick(locale, 'التحرير', 'Desk')}: {deskAuthor}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                {news.readingTime || Math.max(1, Math.ceil(words / 200))} {pick(locale, 'دقيقة قراءة', 'min read')}
              </span>
            </div>
          </div>
        </header>

        <div className="news-report-facts" aria-label={pick(locale, 'حقائق التقرير', 'Report facts')}>
          {facts.map((fact) => (
            <div key={fact.label} className="news-report-fact">
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>

        <div className="news-report-layout">
          <div className="min-w-0 space-y-6">
            <section className="news-report-byline" aria-label={pick(locale, 'بيانات التقرير', 'Report details')}>
              <div className="news-report-byline-grid">
                <div className="news-report-meta-item">
                  <span className="news-report-meta-label">{pick(locale, 'الكاتب / المصدر الأصلي', 'Author / original source')}</span>
                  <span className="news-report-meta-value">
                    {news.sourceUrl ? (
                      <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {sourceLabel}
                      </a>
                    ) : (
                      sourceLabel
                    )}
                  </span>
                </div>
                <div className="news-report-meta-item">
                  <span className="news-report-meta-label">{pick(locale, 'ناشر يلا سبورت', 'Yalla Sport publisher')}</span>
                  <span className="news-report-meta-value">{deskAuthor}</span>
                </div>
                <div className="news-report-meta-item">
                  <span className="news-report-meta-label">{pick(locale, 'تاريخ النشر', 'Published')}</span>
                  <span className="news-report-meta-value inline-flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-orange-500" />
                    {publishedLabel}
                  </span>
                </div>
                <div className="news-report-meta-item">
                  <span className="news-report-meta-label">{pick(locale, 'التصنيف', 'Desk')}</span>
                  <span className="news-report-meta-value">{news.category}</span>
                </div>
              </div>

              <div className="news-report-tools">
                <NewsShareMenu title={localized.title} />
                <NewsAudioReader text={localized.content} />
                {news.sourceUrl ? (
                  <a
                    href={news.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-share-btn"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {pick(locale, 'الأصل على المصدر', 'Read on source')}
                  </a>
                ) : null}
              </div>
            </section>

            {localized.excerpt ? (
              <blockquote className="news-report-pull">
                <p>{localized.excerpt}</p>
                <cite>{sourceLabel}</cite>
              </blockquote>
            ) : null}

            <div className="news-report-body relative">
              <div className="news-report-body-rail" aria-hidden />
              <div
                id="news-report-prose"
                className={`news-report-prose ${!canAccess ? 'is-gated' : ''}`}
                dangerouslySetInnerHTML={{ __html: linkedContent }}
              />
              {canAccess ? <EndMark /> : null}

              {!canAccess ? (
                <div className="news-report-gate">
                  <div className="news-report-gate-card">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                      <Lock className="h-7 w-7" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold tracking-tight">
                      {pick(locale, 'هذا التقرير للمشتركين', 'This report is for subscribers')}
                    </h3>
                    <p className="mb-6 text-sm leading-relaxed text-white/55">
                      {pick(
                        locale,
                        'اشترك في يلا سبورت Premium لقراءة التحليلات الحصرية والتقارير الخاصة.',
                        'Subscribe to Yalla Sport Premium for exclusive analysis and subscriber reports.'
                      )}
                    </p>
                    <Link
                      href="/subscribe"
                      className="mb-3 block rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-orange-600"
                    >
                      {pick(locale, 'اشترك الآن', 'Subscribe now')}
                    </Link>
                    <Link href="/login" className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 hover:text-orange-300">
                      {pick(locale, 'تسجيل الدخول للمشتركين', 'Subscriber sign in')}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {canAccess ? (
              <NewsComments
                newsId={news.id}
                isLoggedIn={Boolean(session?.user?.email)}
                initialComments={news.comments.map((comment) => ({
                  id: comment.id,
                  content: comment.content,
                  createdAt: comment.createdAt.toISOString(),
                  user: { name: comment.user.name, role: comment.user.role },
                }))}
              />
            ) : null}
          </div>

          <aside className="news-report-aside">
            <section className="news-report-panel">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400/90">
                {pick(locale, 'سجل المصدر', 'Source ledger')}
              </p>
              <h2>{sourceLabel}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {pick(
                  locale,
                  'الخبر وارد من مصدر موثوق، راجعته غرفة التحرير، ونُشر بعد الاعتماد فقط.',
                  'This story came from a trusted outlet, was reviewed by the desk, and published only after approval.'
                )}
              </p>
              <div className="mt-4 grid gap-2 text-[11px] text-white/45">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-orange-400" />
                  {news.views + 1} {pick(locale, 'مشاهدة', 'views')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-orange-400" />
                  {pick(locale, 'حدّث', 'Updated')} {updatedLabel}
                </span>
              </div>
              {news.sourceUrl ? (
                <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer" className="news-report-source-link">
                  {pick(locale, 'فتح التقرير الأصلي', 'Open original report')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </section>

            {entities.length > 0 ? (
              <section className="news-report-panel">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400/90">
                  {pick(locale, 'مرتبط بالملعب', 'On the pitch')}
                </p>
                <div className="news-report-entities">
                  {entities.map((entity) => (
                    <Link key={`${entity.type}-${entity.href}`} href={entity.href} className="news-report-entity">
                      {entity.name}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {news.tags.length > 0 ? (
              <section className="news-report-panel">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400/90">
                  {pick(locale, 'وسوم المكتب', 'Desk tags')}
                </p>
                <div className="news-report-tags">
                  {news.tags.map((tag) => (
                    <span key={tag} className="news-report-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="news-report-related">
            <div className="news-section-head">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-600 dark:text-orange-400">
                  {pick(locale, 'من نفس المكتب', 'Same desk')}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                  {pick(locale, 'تقارير ذات صلة', 'Related reports')}
                </h2>
                <DeskRule className="news-section-ornament" />
              </div>
              <Link href="/news" className="text-[11px] font-bold text-orange-600 hover:text-orange-500 dark:text-orange-400">
                {pick(locale, 'كل الأخبار', 'All news')}
              </Link>
            </div>

            <div className="news-report-related-grid">
              {related.map((story) => {
                const cover = publicStoryImage(story);
                return (
                <Link key={story.id} href={`/news/${story.slug}`} className="news-tile">
                  <div className="news-tile-media">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" />
                    ) : (
                      <div className="news-cover-stage h-full w-full" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                      {story.category}
                    </span>
                    <h3 className="text-base font-bold leading-snug tracking-tight">{story.title}</h3>
                    {story.excerpt ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground dark:text-foreground/50">{story.excerpt}</p>
                    ) : null}
                    <span className="mt-auto pt-2 text-[11px] text-muted-foreground dark:text-foreground/35">
                      {story.readingTime} {pick(locale, 'د', 'min')}
                      {story.sourceName ? ` · ${story.sourceName}` : ''}
                    </span>
                  </div>
                </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <p className="news-colophon-mark" aria-hidden>
          YALLA
        </p>
      </div>
    </article>
  );
}
