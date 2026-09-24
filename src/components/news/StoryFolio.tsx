import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { NewsAudioReader } from '@/components/news/NewsAudioReader';
import { NewsComments, type NewsCommentRow } from '@/components/news/NewsComments';
import { NewsShareMenu } from '@/components/news/NewsShareMenu';
import { StoryShareCard } from '@/components/news/StoryShareCard';
import './story-folio.css';

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
  return (
    <article className="ed">
      <span className="ed-aura" aria-hidden />
      <span className="ed-grain" aria-hidden />
      <div className="ed-wrap">
        <nav className="ed-nav">
          <Link href="/news">{pick(locale, 'غرفة الأخبار', 'News desk')}</Link>
          <i />
          <span>{kicker}</span>
          {breaking ? <b>{pick(locale, 'عاجل', 'Breaking')}</b> : null}
          {isPremium ? <b>{pick(locale, 'مميز', 'Premium')}</b> : null}
        </nav>

        <header className="ed-mast">
          <p className="ed-kicker">{kicker}</p>
          <h1 dir={/[A-Za-z]/.test(title.slice(0, 2)) ? 'ltr' : 'auto'}>{title}</h1>
          {showExcerpt && excerpt ? (
            <p className="ed-stand" dir={/[A-Za-z]/.test(excerpt.slice(0, 2)) ? 'ltr' : 'auto'}>
              {excerpt}
            </p>
          ) : null}
          <ul className="ed-by">
            <li>{sourceLabel}</li>
            <li>{deskAuthor}</li>
            <li>{publishedLabel}</li>
            {readMins ? (
              <li>
                {readMins} {pick(locale, 'دقيقة قراءة', 'min read')}
              </li>
            ) : null}
          </ul>
        </header>

        {heroImage ? (
          <figure className="ed-cover">
            <span className="ed-cover-media">
              <CoverImage
                src={heroImage}
                srcSet={heroSrcSet}
                alt={title}
                sizes="(max-width: 768px) 100vw, 72rem"
                priority
                className="object-cover"
              />
              <i className="ed-bracket is-tl" />
              <i className="ed-bracket is-tr" />
              <i className="ed-bracket is-bl" />
              <i className="ed-bracket is-br" />
            </span>
            <figcaption>
              <span>{sourceLabel}</span>
              <em>{pick(locale, 'غلاف التقرير', 'Report cover')}</em>
            </figcaption>
          </figure>
        ) : null}

        <div className="ed-board">
          <aside className="ed-rail">
            <StoryRail
              locale={locale}
              kicker={pick(locale, 'الآن على المكتب', 'On the desk')}
              title={pick(locale, 'أحدث التقارير', 'Latest reports')}
              stories={latest.slice(0, 6)}
            />
            <StoryRail
              locale={locale}
              kicker={pick(locale, 'التداول', 'Circulation')}
              title={pick(locale, 'الأكثر قراءة', 'Most read')}
              stories={popular.slice(0, 6)}
            />
          </aside>

          <div className="ed-spine">
            <div className="ed-sheet">
              <div
                id="news-report-prose"
                className={`ed-prose${!canAccess ? ' is-gated' : ''}${/[A-Za-z]/.test(bodyHtml.replace(/<[^>]+>/g, '').trim().slice(0, 12)) ? ' is-latin' : ''}`}
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />

              {!canAccess ? (
                <div className="ed-gate">
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
                <p className="ed-end" aria-hidden>
                  ◆
                </p>
              )}

              {canAccess && sourceUrl ? (
                <a className="ed-source" href={sourceUrl} target="_blank" rel="noopener noreferrer">
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

              {canAccess ? (
                <div className="ed-tools">
                  <NewsShareMenu title={title} />
                  <NewsAudioReader text={bodyHtml} />
                </div>
              ) : null}

              {canAccess ? <StoryShareCard title={title} locale={locale} /> : null}

              {entities.length > 0 || tags.length > 0 ? (
                <div className="ed-chips">
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
                <section className="ed-talk">
                  <NewsComments newsId={newsId} isLoggedIn={isLoggedIn} initialComments={comments} />
                </section>
              ) : null}
            </div>
          </div>

          <aside className="ed-rail">
            <StoryRail
              locale={locale}
              kicker={pick(locale, 'من نفس المكتب', 'Same desk')}
              title={pick(locale, 'تقارير ذات صلة', 'Related reports')}
              stories={related.slice(0, 6)}
            />
          </aside>
        </div>

        {related.length > 0 || latest.length > 0 ? (
          <section className="ed-floor">
            <div className="ed-more-head">
              <div>
                <p>{pick(locale, 'المزيد من الغرفة', 'More from the desk')}</p>
                <h2>{pick(locale, 'تقارير تكمّل الطبعة', 'Reports that complete the edition')}</h2>
              </div>
              <Link href="/news">{pick(locale, 'كل الأخبار', 'All news')}</Link>
            </div>
            <div className="ed-floor-grid">
              {(related.length > 0 ? related : latest).slice(0, 8).map((story) => (
                <Link key={story.id} href={`/news/${story.slug}`} className="ed-card">
                  <span className="ed-card-media">
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
    <section className="ed-rail-panel">
      <div className="ed-rail-head">
        <p>{kicker}</p>
        <h2>{title}</h2>
      </div>
      <div className="ed-rail-list">
        {stories.map((story) => (
          <Link key={story.id} href={`/news/${story.slug}`} className="ed-rail-item">
            <span className="ed-rail-media">
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
      <Link href="/news" className="ed-rail-more">
        {pick(locale, 'كل الأخبار', 'All news')}
      </Link>
    </section>
  );
}
