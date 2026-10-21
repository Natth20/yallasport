import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { NewsComments, type NewsCommentRow } from '@/components/news/NewsComments';
import { NewsShareMenu } from '@/components/news/NewsShareMenu';
import { NewsReaderToolbar } from '@/components/news/NewsReaderToolbar';
import { NewsEntityDossier } from '@/components/news/NewsEntityDossier';
import { SiteAd } from '@/components/ads/SiteAd';
import styles from './story-folio.module.css';

export type StoryRelated = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  sourceName: string | null;
  publishedAt: string | Date | null;
};

export type PrimaryEntityInfo = {
  type: 'TEAM' | 'LEAGUE' | 'PLAYER';
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  meta?: string;
  city?: string;
  country?: string;
};

export type UpcomingMatchInfo = {
  id: string;
  kickoffAt: string | Date;
  homeTeam: { name: string; logoUrl?: string | null };
  awayTeam: { name: string; logoUrl?: string | null };
  league: { name: string };
};

export function StoryFolio({
  locale,
  newsId,
  slug,
  title,
  excerpt,
  showExcerpt,
  kicker,
  breaking,
  isPremium,
  canAccess,
  heroImage,
  heroSrcSet,
  sourceLabel,
  sourceUrl,
  deskAuthor,
  publishedLabel,
  readLabel,
  bodyHtml,
  clippedCopy,
  protectedSource,
  tags,
  entities,
  related,
  latest = [],
  popular = [],
  otherDeskNews = [],
  trendingIsLive = false,
  comments,
  isLoggedIn,
  primaryEntity,
  upcomingMatch,
}: {
  locale: string;
  newsId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  showExcerpt: boolean;
  kicker: string;
  breaking: boolean;
  isPremium: boolean;
  canAccess: boolean;
  heroImage: string | null;
  heroSrcSet?: string;
  sourceLabel: string;
  sourceUrl: string | null;
  deskAuthor: string;
  publishedLabel: string;
  readLabel: string | null;
  bodyHtml: string;
  clippedCopy: boolean;
  protectedSource: boolean;
  tags: string[];
  entities: { href: string; name: string }[];
  related: StoryRelated[];
  latest?: StoryRelated[];
  popular?: StoryRelated[];
  otherDeskNews?: StoryRelated[];
  trendingIsLive?: boolean;
  comments: NewsCommentRow[];
  isLoggedIn: boolean;
  primaryEntity?: PrimaryEntityInfo | null;
  upcomingMatch?: UpcomingMatchInfo | null;
}) {
  const latin = /[A-Za-z]/.test(title.slice(0, 2));
  const latinExcerpt = excerpt ? /[A-Za-z]/.test(excerpt.slice(0, 2)) : false;
  const latinBody = /[A-Za-z]/.test(bodyHtml.replace(/<[^>]+>/g, '').trim().slice(0, 12));

  // Deduplicate related stories: unified set of unique related items
  const seenIds = new Set<string>();
  const unifiedRelated: StoryRelated[] = [];
  for (const item of related) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      unifiedRelated.push(item);
    }
  }

  // Deduplicate other-desk latest news: must not appear in related
  const distinctOtherNews: StoryRelated[] = [];
  const candidatePool = otherDeskNews.length > 0 ? otherDeskNews : latest;
  for (const item of candidatePool) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      distinctOtherNews.push(item);
    }
  }

  return (
    <article className={styles['ed']}>
      <span className={styles['ed-aura']} aria-hidden />
      <span className={styles['ed-grain']} aria-hidden />
      <div className={styles['ed-wrap']}>
        <nav className={styles['ed-nav']} aria-label={pick(locale, 'مسار الخبر', 'Story path')}>
          <Link href="/news">{pick(locale, 'الأخبار', 'News')}</Link>
          <i />
          <span>{kicker}</span>
          {breaking ? <b>{pick(locale, 'عاجل', 'Breaking')}</b> : null}
          {isPremium ? <b>{pick(locale, 'مميز', 'Premium')}</b> : null}
        </nav>

        <header className={styles['ed-head']}>
          <Link
            href={`/news?desk=${encodeURIComponent(kicker || 'all')}`}
            className={styles['ed-kicker']}
            title={pick(locale, `فتح قسم ${kicker} بالكامل`, `Open full section for ${kicker}`)}
          >
            {kicker}
          </Link>
          <h1 dir={latin ? 'ltr' : 'auto'}>{title}</h1>
          {showExcerpt && excerpt ? (
            <p className={styles['ed-stand']} dir={latinExcerpt ? 'ltr' : 'auto'}>
              {excerpt}
            </p>
          ) : null}
          <ul className={styles['ed-by']}>
            <li>
              {pick(locale, 'المصدر', 'Source')}:{' '}
              <Link
                href={`/news?source=${encodeURIComponent(sourceLabel)}`}
                className="hover:underline font-bold"
                style={{ color: 'inherit' }}
                title={pick(locale, `عرض جميع الأخبار من مصدر ${sourceLabel}`, `View all news from source ${sourceLabel}`)}
              >
                {sourceLabel}
              </Link>
            </li>
            {deskAuthor ? <li>{deskAuthor}</li> : null}
            <li>{publishedLabel}</li>
            {readLabel ? <li>{readLabel}</li> : null}
          </ul>
        </header>

        <div className={styles['ed-board']}>
          <div className={styles['ed-spine']}>
            <div className={styles['ed-sheet']}>
              {/* Main Feature Image: Confined to Content Column Width */}
              {heroImage ? (
                <figure className={styles['ed-cover']}>
                  <span className={styles['ed-cover-media']}>
                    <CoverImage
                      src={heroImage}
                      srcSet={heroSrcSet}
                      alt={title}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 780px, 860px"
                      priority
                      className="object-cover w-full h-full"
                    />
                  </span>
                  <figcaption>
                    <em>{pick(locale, 'من المصدر', 'From source')}</em>
                    <Link
                      href={`/news?source=${encodeURIComponent(sourceLabel)}`}
                      className="hover:underline font-semibold"
                      style={{ color: 'inherit' }}
                      title={pick(locale, `عرض جميع الأخبار من مصدر ${sourceLabel}`, `View all news from source ${sourceLabel}`)}
                    >
                      {sourceLabel}
                    </Link>
                  </figcaption>
                </figure>
              ) : null}

              {/* Reader Interaction Toolbar */}
              <div className="mb-6">
                <NewsReaderToolbar
                  locale={locale}
                  newsId={newsId}
                  title={title}
                  bodyHtml={bodyHtml}
                  readLabel={readLabel}
                  primaryEntity={primaryEntity}
                  isLoggedIn={isLoggedIn}
                />
              </div>

              {/* Entity Dossier & Linked Match Card */}
              {primaryEntity ? (
                <NewsEntityDossier
                  locale={locale}
                  entity={primaryEntity}
                  upcomingMatch={upcomingMatch}
                />
              ) : null}

              <div
                id="news-report-prose"
                className={`${styles['ed-prose']}${!canAccess ? ` ${styles['is-gated']}` : ''}${latinBody ? ` ${styles['is-latin']}` : ''}`}
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />

              {!canAccess ? (
                <div className={styles['ed-gate']}>
                  <strong>{pick(locale, 'هذا التقرير للمشتركين', 'This report is for subscribers')}</strong>
                  <p>
                    {pick(
                      locale,
                      'سجّل دخولك لقراءة التحليلات الحصرية على يلا سبورت.',
                      'Sign in to read exclusive Yalla Sport analysis.',
                    )}
                  </p>
                  <Link href="/login">{pick(locale, 'تسجيل الدخول', 'Sign in')}</Link>
                </div>
              ) : (
                <p className={styles['ed-end']} aria-hidden>
                  ◆
                </p>
              )}
              {canAccess ? <SiteAd placement="article-inline" locale={locale} /> : null}

              {canAccess && sourceUrl ? (
                <a className={styles['ed-source']} href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  <span>
                    {pick(locale, `المصدر: ${sourceLabel}`, `Source: ${sourceLabel}`)}
                    {clippedCopy
                      ? pick(
                        locale,
                        protectedSource
                          ? ' — النص الكامل على الأصل لأن المصدر لا يسمح بنسخه هنا.'
                          : ' — هذا متن الخبر كما استُخرج من المصدر.',
                        protectedSource
                          ? ' — full text remains on the original because the outlet does not allow copying it here.'
                          : ' — this is the extracted article body from the source.',
                      )
                      : ''}
                  </span>
                  <em>{pick(locale, 'قراءة الخبر الأصلي', 'Read original story')}</em>
                </a>
              ) : null}

              {canAccess ? <NewsShareMenu title={title} /> : null}

              {entities.length > 0 || tags.length > 0 ? (
                <div className={styles['ed-chips']}>
                  {entities.map((entity) => (
                    <Link key={entity.href} href={entity.href}>
                      {entity.name}
                    </Link>
                  ))}
                  {tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              ) : null}

              {canAccess ? (
                <section className={styles['ed-talk']}>
                  <NewsComments
                    newsId={newsId}
                    isLoggedIn={isLoggedIn}
                    initialComments={comments}
                    loginHref={`/login?callbackUrl=${encodeURIComponent(`/news/${slug}`)}`}
                  />
                </section>
              ) : null}
            </div>
          </div>

          <aside className={styles['ed-rail']}>
            {/* Unified Related News & Reports */}
            <StoryRail
              locale={locale}
              kicker={pick(locale, 'الأخبار والتقارير المرتبطة', 'Related news & reports')}
              title={pick(locale, 'أخبار وتقارير ذات صلة', 'Related stories')}
              stories={unifiedRelated.slice(0, 5)}
            />

            {/* Other Sections / Fresh News */}
            <StoryRail
              locale={locale}
              kicker={pick(locale, 'من الأقسام الأخرى', 'Other sections')}
              title={pick(locale, 'أحدث الأخبار', 'Latest news')}
              stories={distinctOtherNews.slice(0, 4)}
            />
          </aside>
        </div>

        {/* Separate Bottom Section: Latest Stories from Other Sections */}
        {distinctOtherNews.length > 0 ? (
          <section className={styles['ed-floor']}>
            <div className={styles['ed-more-head']}>
              <div>
                <p>{pick(locale, 'من الأقسام الأخرى', 'Other sections')}</p>
                <h2>{pick(locale, 'أحدث الأخبار والتقارير', 'Latest news & reports')}</h2>
              </div>
              <Link href="/news">{pick(locale, 'كل الأخبار', 'All news')}</Link>
            </div>
            <div className={styles['ed-floor-grid']}>
              {distinctOtherNews.slice(0, 4).map((story) => (
                <div key={story.id} className={styles['ed-card']}>
                  <Link href={`/news/${story.slug}`} className={styles['ed-card-media']}>
                    {story.image ? <CoverImage src={story.image} alt="" sizes="320px" className="object-cover" /> : null}
                  </Link>
                  <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <strong dir={/[A-Za-z]/.test(story.title.slice(0, 2)) ? 'ltr' : 'auto'}>{story.title}</strong>
                  </Link>
                  <small>
                    {story.sourceName ? (
                      <>
                        <Link
                          href={`/news?source=${encodeURIComponent(story.sourceName)}`}
                          title={pick(locale, `عرض جميع الأخبار من مصدر ${story.sourceName}`, `View all news from source ${story.sourceName}`)}
                          className="hover:underline font-semibold"
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {story.sourceName}
                        </Link>
                        {' · '}
                      </>
                    ) : null}
                    {story.publishedAt ? <ClientTime value={story.publishedAt} /> : null}
                  </small>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}

function StoryRail({
  locale,
  kicker,
  title,
  stories,
}: {
  locale: string;
  kicker: string;
  title: string;
  stories: StoryRelated[];
}) {
  if (stories.length === 0) return null;
  return (
    <section style={{marginBottom:"20px"}} className={styles['ed-rail-panel']}>
      <div className={styles['ed-rail-head']}>
        <p>{kicker}</p>
        <h2>{title}</h2>
      </div>
      <div className={styles['ed-rail-list']}>
        {stories.map((story) => (
          <div key={story.id} className={styles['ed-rail-item']}>
            <Link href={`/news/${story.slug}`} className={styles['ed-rail-media']}>
              {story.image ? <CoverImage src={story.image} alt="" sizes="160px" className="object-cover" /> : null}
            </Link>
            <span>
              <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <strong dir={/[A-Za-z]/.test(story.title.slice(0, 2)) ? 'ltr' : 'auto'}>{story.title}</strong>
              </Link>
              <small>
                {story.sourceName ? (
                  <>
                    <Link
                      href={`/news?source=${encodeURIComponent(story.sourceName)}`}
                      title={pick(locale, `عرض جميع الأخبار من مصدر ${story.sourceName}`, `View all news from source ${story.sourceName}`)}
                      className="hover:underline font-semibold"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {story.sourceName}
                    </Link>
                    {' · '}
                  </>
                ) : null}
                {story.publishedAt ? <ClientTime value={story.publishedAt} /> : null}
              </small>
            </span>
          </div>
        ))}
      </div>
      <Link href="/news" className={styles['ed-rail-more']}>
        {pick(locale, 'كل الأخبار', 'All news')}
      </Link>
    </section>
  );
}
