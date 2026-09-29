import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { NewsAudioReader } from '@/components/news/NewsAudioReader';
import { NewsComments, type NewsCommentRow } from '@/components/news/NewsComments';
import { NewsShareMenu } from '@/components/news/NewsShareMenu';
import { StoryShareCard } from '@/components/news/StoryShareCard';
import styles from './story-folio.module.css';

export type StoryRelated = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  sourceName: string | null;
  publishedAt: string | Date | null;
};

export function StoryFolio({
  locale,
  newsId,
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
  readMins,
  bodyHtml,
  clippedCopy,
  protectedSource,
  tags,
  entities,
  related,
  latest = [],
  popular = [],
  comments,
  isLoggedIn,
}: {
  locale: string;
  newsId: string;
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
  readMins: number | null;
  bodyHtml: string;
  clippedCopy: boolean;
  protectedSource: boolean;
  tags: string[];
  entities: { href: string; name: string }[];
  related: StoryRelated[];
  latest?: StoryRelated[];
  popular?: StoryRelated[];
  comments: NewsCommentRow[];
  isLoggedIn: boolean;
}) {
  const latin = /[A-Za-z]/.test(title.slice(0, 2));
  const latinExcerpt = excerpt ? /[A-Za-z]/.test(excerpt.slice(0, 2)) : false;
  const latinBody = /[A-Za-z]/.test(bodyHtml.replace(/<[^>]+>/g, '').trim().slice(0, 12));

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
          <p className={styles['ed-kicker']}>{kicker}</p>
          <h1 dir={latin ? 'ltr' : 'auto'}>{title}</h1>
          {showExcerpt && excerpt ? (
            <p className={styles['ed-stand']} dir={latinExcerpt ? 'ltr' : 'auto'}>
              {excerpt}
            </p>
          ) : null}
          <ul className={styles['ed-by']}>
            <li>{sourceLabel}</li>
            <li>{deskAuthor}</li>
            <li>{publishedLabel}</li>
            {readMins ? (
              <li>
                {readMins} {pick(locale, 'دقيقة قراءة', 'min read')}
              </li>
            ) : null}
          </ul>
          {canAccess ? (
            <div className={styles['ed-toolbar']}>
              <NewsShareMenu title={title} />
              <NewsAudioReader text={bodyHtml} />
            </div>
          ) : null}
        </header>

        {heroImage ? (
          <figure className={styles['ed-cover']}>
            <span className={styles['ed-cover-media']}>
              <CoverImage
                src={heroImage}
                srcSet={heroSrcSet}
                alt={title}
                sizes="(max-width: 768px) 100vw, 72rem"
                priority
                className="object-cover"
              />
            </span>
            <figcaption>
              <em>{pick(locale, 'من المصدر', 'From source')}</em>
              <span>{sourceLabel}</span>
            </figcaption>
          </figure>
        ) : null}

        <div className={styles['ed-board']}>
          <div className={styles['ed-spine']}>
            <div className={styles['ed-sheet']}>
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

              {canAccess && sourceUrl ? (
                <a className={styles['ed-source']} href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  <span>
                    {clippedCopy
                      ? pick(
                        locale,
                        protectedSource
                          ? 'المصدر لا يسمح بنسخ النص الكامل هنا. هذا ما وصل على المكتب.'
                          : 'هذا ما وصل من المصدر على المكتب. إن وُجد باقي النص فهو على الأصل.',
                        protectedSource
                          ? 'The outlet does not allow the full text here. This is the filing on the desk.'
                          : 'This is the filing on the desk. Any remaining text lives on the original.',
                      )
                      : pick(
                        locale,
                        'النص أعلاه منشور على يلا سبورت كما وصل من المصدر.',
                        'The text above is published on Yalla Sport as it arrived from the source.',
                      )}
                  </span>
                  <em>{pick(locale, 'افتح الأصل', 'Open original')}</em>
                </a>
              ) : null}

              {canAccess ? <StoryShareCard title={title} locale={locale} /> : null}

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
                  <NewsComments newsId={newsId} isLoggedIn={isLoggedIn} initialComments={comments} />
                </section>
              ) : null}
            </div>
          </div>

          <aside className={styles['ed-rail']}>
            <StoryRail
              locale={locale}
              kicker={pick(locale, 'نفس الباب', 'Same desk')}
              title={pick(locale, 'تقارير ذات صلة', 'Related reports')}
              stories={related.slice(0, 6)}
            />
            <StoryRail
              locale={locale}
              kicker={pick(locale, 'الأكثر قراءة', 'Most read')}
              title={pick(locale, 'ما يتداول الآن', 'In circulation')}
              stories={popular.slice(0, 5)}
            />
          </aside>
        </div>

        {(related.length > 0 || latest.length > 0) ? (
          <section className={styles['ed-floor']}>
            <div className={styles['ed-more-head']}>
              <div>
                <p>{pick(locale, 'المزيد', 'More')}</p>
                <h2>{pick(locale, 'تقارير تُكمل القراءة', 'Stories that continue the reading')}</h2>
              </div>
              <Link href="/news">{pick(locale, 'كل الأخبار', 'All news')}</Link>
            </div>
            <div className={styles['ed-floor-grid']}>
              {(related.length > 0 ? related : latest).slice(0, 4).map((story) => (
                <Link key={story.id} href={`/news/${story.slug}`} className={styles['ed-card']}>
                  <span className={styles['ed-card-media']}>
                    {story.image ? <CoverImage src={story.image} alt="" sizes="320px" className="object-cover" /> : null}
                  </span>
                  <strong dir={/[A-Za-z]/.test(story.title.slice(0, 2)) ? 'ltr' : 'auto'}>{story.title}</strong>
                  <small>
                    {story.sourceName ? `${story.sourceName} · ` : ''}
                    {story.publishedAt ? <ClientTime value={story.publishedAt} /> : null}
                  </small>
                </Link>
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
    <section className={styles['ed-rail-panel']}>
      <div className={styles['ed-rail-head']}>
        <p>{kicker}</p>
        <h2>{title}</h2>
      </div>
      <div className={styles['ed-rail-list']}>
        {stories.map((story) => (
          <Link key={story.id} href={`/news/${story.slug}`} className={styles['ed-rail-item']}>
            <span className={styles['ed-rail-media']}>
              {story.image ? <CoverImage src={story.image} alt="" sizes="160px" className="object-cover" /> : null}
            </span>
            <span>
              <strong dir={/[A-Za-z]/.test(story.title.slice(0, 2)) ? 'ltr' : 'auto'}>{story.title}</strong>
              <small>
                {story.sourceName ? `${story.sourceName} · ` : ''}
                {story.publishedAt ? <ClientTime value={story.publishedAt} /> : null}
              </small>
            </span>
          </Link>
        ))}
      </div>
      <Link href="/news" className={styles['ed-rail-more']}>
        {pick(locale, 'كل الأخبار', 'All news')}
      </Link>
    </section>
  );
}
