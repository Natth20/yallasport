import { Link } from '@/i18n/navigation';
import { Eye } from 'lucide-react';
import { CoverImage } from '@/components/common/CoverImage';
import { ClientTime } from '@/components/datetime/ClientTime';
import { FrontWhen } from '@/components/front/FrontWhen';
import { pick } from '@/i18n/pick';
import { deskLabel } from '@/lib/news/desks';
import { listedReadingMinutes } from '@/lib/news/reading-time';
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

function readingStamp(story: CardStory, locale: string) {
  const mins = listedReadingMinutes(story);
  return mins > 0 ? ` · ${mins} ${pick(locale, 'د', 'min')}` : '';
}

export function NewsInkMast({
  locale,
  stats,
  compact = false,
}: {
  locale: string;
  stats: DeskStats;
  compact?: boolean;
}) {
  const meters = (
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
      {compact ? null : (
        <div>
          <dt>{pick(locale, 'هذا الأسبوع', 'This week')}</dt>
          <dd>{stats.weekCount}</dd>
        </div>
      )}
    </dl>
  );

  if (compact) {
    return (
      <aside className={styles['nk-brief']} aria-label={pick(locale, 'ملخص الغرفة', 'Desk brief')}>
        <p>{pick(locale, 'معتمد من التحرير فقط. العنوان يفتح الطبعة.', 'Desk-approved only. A title opens the edition.')}</p>
        {meters}
      </aside>
    );
  }

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
      {meters}
    </header>
  );
}

function getDayParts(dateVal: Date | string, locale: string) {
  const d = new Date(dateVal);
  const isAr = locale === 'ar';
  // Distinct day name (e.g. الأربعاء / Wed)
  const dayName = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short' });
  // Distinct day number and month (e.g. 21 أكتوبر / Oct 21)
  const dayNumber = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric' });
  const monthName = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' });
  return { dayName, dayNumber, monthName };
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
  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const totalWeekly = days.reduce((acc, d) => acc + d.count, 0);

  // Today's YYYY-MM-DD
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <section className={`${styles['nk-panel']} ${styles['nk-pulse-panel']}`}>
      <div className={styles['nk-panel-head']}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full border-b border-border/50 pb-3 mb-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {pick(locale, 'مؤشر التغطية الصحفية', 'Newsroom telemetry')}
            </p>
            <h2 className="mt-1 text-base font-black text-foreground">
              {pick(locale, 'كم وصل على المكتب كل يوم', 'How much reached the desk each day')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-black text-primary shadow-xs">
              <span className="font-black tabular-nums">{totalWeekly}</span>
              <span>{pick(locale, 'تقرير هذا الأسبوع', 'reports this week')}</span>
            </span>
          </div>
        </div>
      </div>

      <div className={styles['nk-pulse']}>
        {days.map((day) => {
          const isToday = day.key === todayKey || day.key === days[days.length - 1]?.key;
          const { dayName, dayNumber, monthName } = getDayParts(day.date, locale);
          const hasReports = day.count > 0;
          const heightPct = hasReports
            ? Math.max(22, Math.round((day.count / maxCount) * 100))
            : 8;

          return (
            <Link
              key={day.key}
              href={hrefFor({ day: day.key })}
              className={`${styles['nk-pulse-day']} ${isToday ? styles['is-today'] : ''}`}
              title={pick(
                locale,
                `أخبار يوم ${dayName}، ${dayNumber} ${monthName} (${day.count} تقرير)`,
                `News for ${dayName}, ${monthName} ${dayNumber} (${day.count} reports)`
              )}
            >
              {/* Day info Header */}
              <div className="flex flex-col items-center gap-0.5 text-center w-full">
                <span className={styles['nk-pulse-day-title']}>
                  {dayName}
                </span>
                <span className={styles['nk-pulse-day-date']}>
                  {dayNumber} {monthName}
                </span>
                {isToday ? (
                  <span className={styles['nk-pulse-today-pill']}>
                    {pick(locale, 'اليوم', 'Today')}
                  </span>
                ) : (
                  <span className="h-4" aria-hidden />
                )}
              </div>

              {/* Vertical Telemetry Tower */}
              <div className={styles['nk-pulse-track']}>
                <div
                  className={`${styles['nk-pulse-bar']} ${hasReports ? styles['is-active'] : styles['is-idle']}`}
                  style={{ height: `${heightPct}%` }}
                >
                  {hasReports ? (
                    <span className={styles['nk-pulse-bar-tip']} />
                  ) : null}
                </div>
              </div>

              {/* Count Footer */}
              <div className="flex flex-col items-center gap-0.5 text-center w-full mt-1">
                <strong className={hasReports ? 'text-primary font-black' : 'text-muted-foreground font-bold'}>
                  {day.count}
                </strong>
                <small className="text-[10px] font-semibold text-muted-foreground/80">
                  {day.count === 1
                    ? pick(locale, 'تقرير', 'report')
                    : pick(locale, 'تقارير', 'reports')}
                </small>
              </div>
            </Link>
          );
        })}
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
              <div className={styles['nk-wire-item']}>
                <Link href={`/news/${story.slug}`} className={styles['nk-wire-media']}>
                  {cover ? (
                    <CoverImage src={cover} alt="" sizes="(max-width: 900px) 50vw, 22vw" className="object-cover" />
                  ) : null}
                  <b className={styles['nk-wire-num']}>{String(index + 1).padStart(2, '0')}</b>
                </Link>
                <span className={styles['nk-wire-copy']}>
                  <em>
                    <Link
                      href={`/news?desk=${encodeURIComponent(story.category || 'all')}`}
                      title={pick(locale, `فتح قسم ${deskLabel(story.category, locale)} بالكامل`, `Open full section for ${deskLabel(story.category, locale)}`)}
                      className="hover:underline"
                    >
                      {deskLabel(story.category, locale)}
                    </Link>
                  </em>
                  <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <strong dir={titleDir(story.title)}>{story.title}</strong>
                  </Link>
                  <small>
                    <Link
                      href={`/news?source=${encodeURIComponent(story.sourceName || 'يلا سبورت')}`}
                      title={pick(locale, `عرض جميع الأخبار من مصدر ${story.sourceName || 'يلا سبورت'}`, `View all news from source ${story.sourceName || 'Yalla Sport'}`)}
                      className="hover:underline font-semibold"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
                    </Link>
                    {story.publishedAt ? (
                      <>
                        {' · '}
                        <FrontWhen value={story.publishedAt} />
                      </>
                    ) : null}
                    {readingStamp(story, locale)}
                  </small>
                </span>
              </div>
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

export function NewsInkCover({
  story,
  locale,
  folio,
  total,
}: {
  story: CardStory;
  locale: string;
  folio: string;
  total: string;
}) {
  return (
    <section id="news-cover" className={styles['nk-cover']} aria-live="polite">
      <div className={styles['nk-chassis']}>
        <div className={styles['nk-bezel']}>
          <span className={styles['nk-bezel-left']}>
            <span className={styles['nk-eq']} aria-hidden>
              <span />
              <span />
              <span />
            </span>
            {pick(locale, 'أبرز الأخبار', 'Lead stories')}
          </span>
          <span className={styles['nk-bezel-right']}>
            <b>{pick(locale, 'غرفة الأخبار', 'Newsroom')}</b>
          </span>
        </div>
        <NewsInkLead story={story} locale={locale} />
      </div>
    </section>
  );
}

export function NewsInkQueue({
  stories,
  locale,
}: {
  stories: CardStory[];
  locale: string;
}) {
  if (stories.length === 0) return null;
  return (
    <aside className={styles['nk-queue']} aria-label={pick(locale, 'قائمة الطبعة', 'Edition programme')}>
      <header className={styles['nk-queue-head']}>
        <p>{pick(locale, 'بعد الغلاف', 'After the cover')}</p>
        <h3>{pick(locale, 'قائمة الطبعة', 'Edition programme')}</h3>
      </header>
      <ol className={styles['nk-queue-list']}>
        {stories.map((story, index) => {
          const cover = storyCover(story);
          return (
            <li key={story.id}>
              <div className={styles['nk-queue-item']}>
                <span className={styles['nk-queue-num']}>{String(index + 2).padStart(2, '0')}</span>
                <Link href={`/news/${story.slug}`} className={styles['nk-queue-thumb']}>
                  {cover ? <CoverImage src={cover} alt="" sizes="120px" className="object-cover" /> : null}
                </Link>
                <span className={styles['nk-queue-copy']}>
                  <em>
                    <Link
                      href={`/news?desk=${encodeURIComponent(story.category || 'all')}`}
                      title={pick(locale, `فتح قسم ${deskLabel(story.category, locale)} بالكامل`, `Open full section for ${deskLabel(story.category, locale)}`)}
                      className="hover:underline"
                    >
                      {deskLabel(story.category, locale)}
                    </Link>
                  </em>
                  <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <b dir={titleDir(story.title)}>{story.title}</b>
                  </Link>
                  <small>
                    <Link
                      href={`/news?source=${encodeURIComponent(story.sourceName || 'يلا سبورت')}`}
                      title={pick(locale, `عرض جميع الأخبار من مصدر ${story.sourceName || 'يلا سبورت'}`, `View all news from source ${story.sourceName || 'Yalla Sport'}`)}
                      className="hover:underline font-semibold"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
                    </Link>
                    {story.publishedAt ? (
                      <>
                        {' · '}
                        <FrontWhen value={story.publishedAt} />
                      </>
                    ) : null}
                  </small>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export function NewsInkLead({ story, locale }: { story: CardStory; locale: string }) {
  const cover = storyCover(story);
  const srcSet = publicStoryImage(story);
  return (
    <div className={styles['nk-front']}>
      <Link href={`/news/${story.slug}`} className={styles['nk-front-media']}>
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
      </Link>
      <span className={styles['nk-front-copy']}>
        <em>
          <Link
            href={`/news?desk=${encodeURIComponent(story.category || 'all')}`}
            title={pick(locale, `فتح قسم ${deskLabel(story.category, locale)} بالكامل`, `Open full section for ${deskLabel(story.category, locale)}`)}
            className="hover:underline"
          >
            {deskLabel(story.category, locale)}
          </Link>
          {story.breaking ? ` · ${pick(locale, 'عاجل', 'Breaking')}` : ''}
        </em>
        <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <strong dir={titleDir(story.title)}>{story.title}</strong>
        </Link>
        {story.excerpt ? (
          <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            <b dir={titleDir(story.excerpt)}>{story.excerpt}</b>
          </Link>
        ) : null}
        <small>
          <Link
            href={`/news?source=${encodeURIComponent(story.sourceName || 'يلا سبورت')}`}
            title={pick(locale, `عرض جميع الأخبار من مصدر ${story.sourceName || 'يلا سبورت'}`, `View all news from source ${story.sourceName || 'Yalla Sport'}`)}
            className="hover:underline font-semibold"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          </Link>
          {story.publishedAt ? (
            <>
              {' · '}
              <FrontWhen value={story.publishedAt} />
            </>
          ) : null}
          {story.views > 0 ? (
            <span className="inline-flex items-center gap-1 font-bold text-primary">
              {' · '}
              <Eye className="h-3 w-3 inline" />
              {story.views} {pick(locale, 'مشاهدة', 'views')}
            </span>
          ) : null}
        </small>
      </span>
    </div>
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
        <nav className={`${styles['nk-index']} ${styles['is-pills']}`} aria-label={pick(locale, 'أبواب التغطية', 'Coverage desks')}>
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
          <nav className={`${styles['nk-index']} ${styles['is-pills']}`} aria-label={pick(locale, 'المصادر', 'Sources')}>
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
    <div className={styles['nk-card']}>
      <Link href={`/news/${story.slug}`} className={styles['nk-card-media']}>
        {cover ? <CoverImage src={cover} alt="" sizes="220px" className="object-cover" /> : null}
      </Link>
      <span className={styles['nk-card-copy']}>
        <em>
          <Link
            href={`/news?desk=${encodeURIComponent(story.category || 'all')}`}
            title={pick(locale, `فتح قسم ${deskLabel(story.category, locale)} بالكامل`, `Open full section for ${deskLabel(story.category, locale)}`)}
            className="hover:underline"
          >
            {deskLabel(story.category, locale)}
          </Link>
        </em>
        <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <strong dir={titleDir(story.title)}>{story.title}</strong>
        </Link>
        <small>
          <Link
            href={`/news?source=${encodeURIComponent(story.sourceName || 'يلا سبورت')}`}
            title={pick(locale, `عرض جميع الأخبار من مصدر ${story.sourceName || 'يلا سبورت'}`, `View all news from source ${story.sourceName || 'Yalla Sport'}`)}
            className="hover:underline font-semibold"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          </Link>
          {story.publishedAt ? (
            <>
              {' · '}
              <FrontWhen value={story.publishedAt} />
            </>
          ) : null}
          {readingStamp(story, locale)}
          {'views' in story && story.views ? ` · ${story.views} ${pick(locale, 'مشاهدة', 'views')}` : ''}
        </small>
      </span>
    </div>
  );
}

export function NewsInkLanes({
  stories,
  desks,
  exclude,
  locale,
  hrefFor,
}: {
  stories: Brief[];
  desks: DeskChip[];
  exclude: Set<string>;
  locale: string;
  hrefFor: (next: { desk?: string; page?: number }) => string;
}) {
  const countByDesk = new Map(desks.map((desk) => [desk.key, desk.count]));
  const buckets = new Map<string, Brief[]>();
  for (const story of stories) {
    if (exclude.has(story.id) || story.category === 'Football') continue;
    const items = buckets.get(story.category) ?? [];
    if (items.length < 4) items.push(story);
    buckets.set(story.category, items);
  }
  const lanes = [...buckets.entries()]
    .map(([key, items]) => ({
      desk: { key, label: key, count: countByDesk.get(key) ?? items.length },
      items,
    }))
    .filter((lane) => lane.items.length >= 2)
    .sort((a, b) => b.desk.count - a.desk.count)
    .slice(0, 4);

  if (lanes.length === 0) return null;

  return (
    <section className={styles['nk-lanes']} aria-label={pick(locale, 'الأبواب من الملف', 'Desks on file')}>
      <header className={styles['nk-wall-head']}>
        <div>
          <p>{pick(locale, 'من الملف', 'On file')}</p>
          <h2>{pick(locale, 'أبواب التغطية هذا الأسبوع', 'Coverage desks this week')}</h2>
        </div>
        <p>{pick(locale, 'تقارير معتمدة فقط، مصنّفة كما وصلت من المصدر.', 'Approved reports only, filed as they arrived from the source.')}</p>
      </header>
      <div className={styles['nk-lane-grid']}>
        {lanes.map((lane) => (
          <article key={lane.desk.key} className={styles['nk-lane']}>
            <header>
              <Link href={hrefFor({ desk: lane.desk.key, page: 1 })}>
                {deskLabel(lane.desk.key, locale)}
              </Link>
              <Link href={hrefFor({ desk: lane.desk.key, page: 1 })}>
                {lane.desk.count} {pick(locale, 'تقرير', 'reports')}
              </Link>
            </header>
            <ol>
              {lane.items.map((story) => (
                <li key={story.id}>
                  <div style={{ display: 'contents' }}>
                    <Link href={`/news/${story.slug}`}>
                      <strong dir={titleDir(story.title)}>{story.title}</strong>
                    </Link>
                    <small>
                      <Link
                        href={`/news?source=${encodeURIComponent(story.sourceName || 'يلا سبورت')}`}
                        title={pick(locale, `عرض جميع الأخبار من مصدر ${story.sourceName || 'يلا سبورت'}`, `View all news from source ${story.sourceName || 'Yalla Sport'}`)}
                        className="hover:underline"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {story.sourceName || pick(locale, 'المصدر', 'Source')}
                      </Link>
                      {story.publishedAt ? (
                        <>
                          {' · '}
                          <FrontWhen value={story.publishedAt} />
                        </>
                      ) : null}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
