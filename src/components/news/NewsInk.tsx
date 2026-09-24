import { Link } from '@/i18n/navigation';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import { deskLabel } from '@/lib/news/desks';
import { galleryImageSrcSet, publicStoryImage, upgradeGalleryImageUrl } from '@/lib/news/enrich-source';
import type { ArchiveDay, Brief, DeskChip, DeskStats, SourceTally, Story } from '@/lib/news/load-desk';
import styles from './news-chamber.module.css';

type CardStory = Story | Brief;

function storyCover(story: CardStory) {
  const raw = publicStoryImage(story);
  return raw ? upgradeGalleryImageUrl(raw) : null;
}

function titleDir(title: string) {
  return /[A-Za-z]/.test(title.slice(0, 2)) ? 'ltr' : 'auto';
}

export function NewsInkMast({
  locale,
  stats,
}: {
  locale: string;
  stats: DeskStats;
}) {
  return (
    <header className={styles['nk-mast']}>
      <div className={styles['nk-mast-copy']}>
        <p className={styles['nk-kicker']}>{pick(locale, 'غرفة الأخبار', 'News desk')}</p>
        <h1>{pick(locale, 'الأخبار', 'News')}</h1>
        <p className={styles['nk-lead']}>
          {pick(
            locale,
            'تقارير من المصدر، تمرّ على التحرير، وتُنشر بعد الاعتماد فقط. اضغط أي عنوان لتقرأ الطبعة كاملة.',
            'Reports from the source, reviewed by the desk, published only after approval. Open any title to read the full edition.',
          )}
        </p>
      </div>
      <dl className={styles['nk-meters']}>
        <div>
          <dt>{pick(locale, 'تقارير', 'Reports')}</dt>
          <dd>{stats.stories}</dd>
        </div>
        <div>
          <dt>{pick(locale, 'مصادر', 'Sources')}</dt>
          <dd>{stats.sources}</dd>
        </div>
        <div>
          <dt>{pick(locale, 'أبواب', 'Desks')}</dt>
          <dd>{stats.desks}</dd>
        </div>
        <div>
          <dt>{pick(locale, 'هذا الأسبوع', 'This week')}</dt>
          <dd>{stats.weekCount}</dd>
        </div>
      </dl>
    </header>
  );
}

export function NewsInkPulse({
  archive,
  locale,
  hrefFor,
}: {
  archive: ArchiveDay[];
  locale: string;
  hrefFor: (next: { day?: string | null }) => string;
}) {
  if (archive.length === 0) return null;
  const days = [...archive].reverse();
  return (
    <section className={`${styles['nk-panel']} ${styles['nk-pulse-panel']}`}>
      <div className={styles['nk-panel-head']}>
        <p>{pick(locale, 'إيقاع الأسبوع', 'Week pulse')}</p>
        <h2>{pick(locale, 'كم وصل على المكتب كل يوم', 'How much reached the desk each day')}</h2>
      </div>
      <div className={styles['nk-pulse']}>
        {days.map((day) => (
          <Link key={day.key} href={hrefFor({ day: day.key })} className={styles['nk-pulse-day']}>
            <small>
              <ClientTime value={day.date} options={{ weekday: 'long' }} />
            </small>
            <strong>{day.count}</strong>
            <em>
              <ClientTime value={day.date} options={{ day: 'numeric', month: 'long' }} />
            </em>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function NewsInkDesks({
  desks,
  locale,
  selected,
  hrefFor,
}: {
  desks: DeskChip[];
  locale: string;
  selected: string;
  hrefFor: (next: { desk?: string; page?: number }) => string;
}) {
  if (desks.length === 0) return null;
  return (
    <section className={`${styles['nk-panel']} ${styles['nk-desks-panel']}`}>
      <div className={styles['nk-panel-head']}>
        <p>{pick(locale, 'خريطة التغطية', 'Coverage map')}</p>
        <h2>{pick(locale, 'الأبواب كما هي على الملف', 'Desks as filed')}</h2>
      </div>
      <div className={styles['nk-desks']}>
        {desks.map((desk, index) => (
          <Link
            key={desk.key}
            href={hrefFor({ desk: selected === desk.key ? 'all' : desk.key, page: 1 })}
            className={`${styles['nk-desk']}${selected === desk.key ? ` ${styles['is-on']}` : ''}`}
          >
            <b>{String(index + 1).padStart(2, '0')}</b>
            <em>{deskLabel(desk.key, locale)}</em>
            <strong>{desk.count}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function NewsInkFresh({ stories, locale }: { stories: Brief[]; locale: string }) {
  if (stories.length === 0) return null;
  return (
    <section className={`${styles['nk-panel']} ${styles['nk-wire']}`}>
      <div className={styles['nk-panel-head']}>
        <p>{pick(locale, 'السلك', 'The wire')}</p>
        <h2>{pick(locale, 'آخر ما وصل واعتمد', 'Latest arrivals on file')}</h2>
      </div>
      <ol className={styles['nk-wire-list']}>
        {stories.map((story, index) => {
          const cover = storyCover(story);
          return (
            <li key={story.id}>
              <Link href={`/news/${story.slug}`} className={styles['nk-wire-item']}>
                <span className={styles['nk-wire-media']}>
                  {cover ? (
                    <CoverImage src={cover} alt="" sizes="(max-width: 900px) 50vw, 22vw" className="object-cover" />
                  ) : null}
                  <b className={styles['nk-wire-num']}>{String(index + 1).padStart(2, '0')}</b>
                </span>
                <span className={styles['nk-wire-copy']}>
                  <em>{deskLabel(story.category, locale)}</em>
                  <strong dir={titleDir(story.title)}>{story.title}</strong>
                  <small>
                    {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
                    {story.publishedAt ? (
                      <>
                        {' · '}
                        <ClientTime value={story.publishedAt} />
                      </>
                    ) : null}
                    {story.readingTime ? ` · ${story.readingTime} ${pick(locale, 'د', 'min')}` : ''}
                  </small>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function NewsInkLedger({
  sources,
  locale,
}: {
  sources: SourceTally[];
  locale: string;
}) {
  if (sources.length === 0) return null;
  const arabic = sources.filter((source) => source.locales.some((item) => item.toLowerCase().startsWith('ar'))).length;
  const english = sources.filter((source) => source.locales.some((item) => item.toLowerCase().startsWith('en'))).length;
  const top = sources[0];
  return (
    <section className={`${styles['nk-panel']} ${styles['nk-ledger']}`}>
      <div className={styles['nk-panel-head']}>
        <p>{pick(locale, 'دفتر المصادر', 'Source book')}</p>
        <h2>{pick(locale, 'من أين يأتي الملف', 'Where the file comes from')}</h2>
      </div>
      <ul>
        <li>
          <em>{pick(locale, 'مصادر عربية', 'Arabic sources')}</em>
          <b>{arabic}</b>
        </li>
        <li>
          <em>{pick(locale, 'مصادر إنجليزية', 'English sources')}</em>
          <b>{english}</b>
        </li>
        {top ? (
          <li>
            <em>{pick(locale, 'الأكثر حضوراً', 'Most present')}</em>
            <b>{top.count}</b>
            <small>{top.name}</small>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export function NewsInkLead({ story, locale }: { story: CardStory; locale: string }) {
  const cover = storyCover(story);
  const srcSet = publicStoryImage(story);
  return (
    <Link href={`/news/${story.slug}`} className={styles['nk-front']}>
      <span className={styles['nk-front-media']}>
        {cover ? (
          <CoverImage
            src={cover}
            srcSet={srcSet ? galleryImageSrcSet(srcSet) : undefined}
            alt={story.title}
            sizes="(max-width: 900px) 100vw, 70vw"
            priority
            className="object-cover"
          />
        ) : null}
        <i className={`${styles['nk-bracket']} ${styles['is-tl']}`} />
        <i className={`${styles['nk-bracket']} ${styles['is-tr']}`} />
        <i className={`${styles['nk-bracket']} ${styles['is-bl']}`} />
        <i className={`${styles['nk-bracket']} ${styles['is-br']}`} />
      </span>
      <span className={styles['nk-front-copy']}>
        <em>
          {deskLabel(story.category, locale)}
          {story.breaking ? ` · ${pick(locale, 'عاجل', 'Breaking')}` : ''}
        </em>
        <strong dir={titleDir(story.title)}>{story.title}</strong>
        {story.excerpt ? <b dir={titleDir(story.excerpt)}>{story.excerpt}</b> : null}
        <small>
          {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          {story.publishedAt ? (
            <>
              {' · '}
              <ClientTime value={story.publishedAt} />
            </>
          ) : null}
        </small>
      </span>
    </Link>
  );
}

export function NewsInkTools({
  locale,
  query,
  selectedDesk,
  selectedSource,
  desks,
  sources,
  hrefFor,
}: {
  locale: string;
  query: string;
  selectedDesk: string;
  selectedSource: string;
  desks: DeskChip[];
  sources: SourceTally[];
  hrefFor: (next: { q?: string; desk?: string; source?: string; page?: number }) => string;
}) {
  return (
    <section className={styles['nk-tools']}>
      <form method="get" className={styles['nk-search']}>
        <label htmlFor="nk-q">{pick(locale, 'ابحث في التقارير المعتمدة', 'Search approved reports')}</label>
        <input
          id="nk-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={pick(locale, 'عنوان، فريق، أو مصدر…', 'Title, team, or source…')}
        />
        {selectedDesk !== 'all' ? <input type="hidden" name="desk" value={selectedDesk} /> : null}
        {selectedSource !== 'all' ? <input type="hidden" name="source" value={selectedSource} /> : null}
      </form>

      <div className={styles['nk-tool-row']}>
        <p>{pick(locale, 'الأبواب', 'Desks')}</p>
        <nav className={styles['nk-index']} aria-label={pick(locale, 'أبواب التغطية', 'Coverage desks')}>
          <Link href={hrefFor({ desk: 'all', page: 1 })} className={selectedDesk === 'all' ? styles['is-on'] : undefined}>
            <em>{pick(locale, 'الكل', 'All')}</em>
          </Link>
          {desks.map((desk) => (
            <Link
              key={desk.key}
              href={hrefFor({ desk: desk.key, page: 1 })}
              className={selectedDesk === desk.key ? styles['is-on'] : undefined}
            >
              <em>{deskLabel(desk.key, locale)}</em>
              <b>{desk.count}</b>
            </Link>
          ))}
        </nav>
      </div>

      {sources.length > 1 ? (
        <div className={styles['nk-tool-row']}>
          <p>{pick(locale, 'المصادر', 'Sources')}</p>
          <nav className={`${styles['nk-index']} ${styles['is-source']}`} aria-label={pick(locale, 'المصادر', 'Sources')}>
            <Link href={hrefFor({ source: 'all', page: 1 })} className={selectedSource === 'all' ? styles['is-on'] : undefined}>
              <em>{pick(locale, 'الكل', 'All')}</em>
            </Link>
            {sources.map((source) => (
              <Link
                key={source.name}
                href={hrefFor({ source: source.name, page: 1 })}
                className={selectedSource === source.name ? styles['is-on'] : undefined}
              >
                <em>{source.name}</em>
                <b>{source.count}</b>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </section>
  );
}

export function NewsInkCard({ story, locale }: { story: CardStory; locale: string }) {
  const cover = storyCover(story);
  return (
    <Link href={`/news/${story.slug}`} className={styles['nk-card']}>
      <span className={styles['nk-card-media']}>
        {cover ? <CoverImage src={cover} alt="" sizes="220px" className="object-cover" /> : null}
      </span>
      <span className={styles['nk-card-copy']}>
        <em>{deskLabel(story.category, locale)}</em>
        <strong dir={titleDir(story.title)}>{story.title}</strong>
        <small>
          {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          {story.publishedAt ? (
            <>
              {' · '}
              <ClientTime value={story.publishedAt} />
            </>
          ) : null}
          {'readingTime' in story && story.readingTime ? ` · ${story.readingTime} ${pick(locale, 'د', 'min')}` : ''}
          {'views' in story && story.views ? ` · ${story.views} ${pick(locale, 'مشاهدة', 'views')}` : ''}
        </small>
      </span>
    </Link>
  );
}
