import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { DeskRule, EditionPlate } from '@/components/news/NewsOrnaments';
import { TicketBarcode } from '@/components/decor/CraftMarks';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { DeskChip, DeskStats, PitchMatch, SourceTally } from '@/lib/news/load-desk';
import { ChevronLeft, Search } from 'lucide-react';

/** Live and same-day fixtures from the sports API sync — newest first, never invented. */
export function EditionWire({ matches, locale }: { matches: PitchMatch[]; locale: string }) {
  const liveCount = matches.filter((match) => match.status === 'LIVE' || match.status === 'HALFTIME').length;
  const label =
    liveCount > 0
      ? pick(locale, 'سلك الملعب المباشر', 'Live Match Wire')
      : pick(locale, 'سلك الملعب · أحدث الركلات', 'Pitch wire · latest kickoffs');

  return (
    <div className="news-wire">
      <div className="news-wire-inner">
        <div className="news-wire-badge">
          <span className="news-wire-pulse" aria-hidden>
            <span />
            <span />
          </span>
          <span>{label}</span>
          {liveCount > 0 ? (
            <em>
              {liveCount} {pick(locale, 'الآن', 'live')}
            </em>
          ) : null}
        </div>
        <div className="news-wire-track">
          {matches.map((match) => {
            const live = match.status === 'LIVE' || match.status === 'HALFTIME';
            const hasScore = typeof match.homeScore === 'number' && typeof match.awayScore === 'number';
            return (
              <Link key={match.id} href={`/match/${match.id}`} className={`news-wire-card ${live ? 'is-live' : ''}`}>
                {match.league?.name ? <span className="news-wire-league">{match.league.name}</span> : null}
                <span className="news-wire-row">
                  {match.homeTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.homeTeam.logoUrl} alt="" />
                  ) : null}
                  <span className="truncate">{match.homeTeam.name}</span>
                </span>
                {live ? (
                  <span className="news-wire-score">
                    <i />
                    {hasScore ? `${match.homeScore}–${match.awayScore}` : pick(locale, 'مباشر', 'LIVE')}
                    {match.minute ? <small>{match.minute}&apos;</small> : null}
                  </span>
                ) : (
                  <span className="news-wire-time">
                    <ClientTime value={match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                  </span>
                )}
                <span className="news-wire-row">
                  <span className="truncate">{match.awayTeam.name}</span>
                  {match.awayTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.awayTeam.logoUrl} alt="" />
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * The masthead ledger — every figure here is a count of real rows, so it
 * doubles as an honest statement of how much the desk is actually carrying.
 */
export function EditionLedger({ stats, locale }: { stats: DeskStats; locale: string }) {
  const cells = [
    { label: pick(locale, 'تقارير منشورة', 'Published'), value: stats.stories },
    { label: pick(locale, 'مصادر موثوقة', 'Sources'), value: stats.sources },
    { label: pick(locale, 'أبواب', 'Desks'), value: stats.desks },
    { label: pick(locale, 'هذا الأسبوع', 'This week'), value: stats.weekCount },
    { label: pick(locale, 'اليوم', 'Today'), value: stats.todayCount },
    { label: pick(locale, 'دقائق قراءة', 'Minutes of reading'), value: stats.totalReadingTime },
  ];

  return (
    <dl className="news-ledger">
      {cells.map((cell) => (
        <div key={cell.label} className="news-ledger-cell">
          <dt>{cell.label}</dt>
          <dd>{cell.value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}</dd>
        </div>
      ))}
      {stats.latestAt && (
        <div className="news-ledger-cell is-stamp">
          <dt>{pick(locale, 'آخر تحديث', 'Last filed')}</dt>
          <dd>
            <ClientTime value={stats.latestAt} options={{ hour: '2-digit', minute: '2-digit' }} />
          </dd>
        </div>
      )}
    </dl>
  );
}

export function EditionMast({
  locale,
  year,
  now,
  stats,
}: {
  locale: string;
  year: number;
  now: Date;
  stats: DeskStats;
}) {
  return (
    <header className="news-mast">
      <div className="news-mast-row">
        <div className="news-mast-brand">
          <EditionPlate year={year} label={pick(locale, 'العدد', 'Issue')} />
          <div>
            <p className="news-mast-wordmark">
              Yalla <span>Desk</span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.26em]">
              <span className="inline-flex items-center gap-2 text-orange-500">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.9)]" />
                {pick(locale, 'غرفة الأخبار', 'News desk')}
              </span>
              <span className="hidden h-px w-6 bg-orange-400/35 sm:block" />
              <span className="text-muted-foreground dark:text-foreground/40">
                <ClientTime value={now} options={{ weekday: 'long', day: 'numeric', month: 'long' }} />
              </span>
            </div>
          </div>
        </div>
        <div className="max-w-sm sm:text-end">
          <TicketBarcode className="mb-2 ms-auto text-muted-foreground/50 dark:text-foreground/25" />
          <p className="text-[11px] font-medium leading-6 tracking-normal text-muted-foreground dark:text-foreground/40">
            {pick(
              locale,
              'من المصدر، بعد اعتماد التحرير فقط — بلا ضجيج ولا عناوين بلا أصل.',
              'From the source, after desk approval only — no noise, no sourceless headlines.'
            )}
          </p>
        </div>
      </div>
      <EditionLedger stats={stats} locale={locale} />
      <DeskRule className="mt-3" />
    </header>
  );
}

export function BreakingStrip({
  slug,
  title,
  locale,
  publishedAt,
}: {
  slug: string;
  title: string;
  locale: string;
  publishedAt?: Date | string | null;
}) {
  return (
    <Link href={`/news/${slug}`} className="news-breaking">
      <span className="news-breaking-dot" aria-hidden />
      <span className="news-breaking-kicker">{pick(locale, 'عاجل', 'Breaking')}</span>
      <strong>{title}</strong>
      {publishedAt ? (
        <span className="news-breaking-time">
          <ClientTime value={publishedAt} />
        </span>
      ) : null}
      <ChevronLeft className="news-breaking-chevron" />
    </Link>
  );
}

/** Search, desk chips and source chips — the page's whole filter surface. */
export function DeskTools({
  locale,
  query,
  selectedDesk,
  selectedSource,
  deskChips,
  sources,
  hrefFor,
}: {
  locale: string;
  query: string;
  selectedDesk: string;
  selectedSource: string;
  deskChips: DeskChip[];
  sources: SourceTally[];
  hrefFor: (next: { q?: string; desk?: string; source?: string; page?: number }) => string;
}) {
  return (
    <div className="news-desk-tools">
      <form method="get" className="news-desk-search">
        <span className="absolute start-0 top-1/2 -translate-y-1/2 text-orange-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={pick(locale, 'ابحث في التقارير المعتمدة', 'Search approved reports')}
        />
        {selectedDesk !== 'all' && <input type="hidden" name="desk" value={selectedDesk} />}
        {selectedSource !== 'all' && <input type="hidden" name="source" value={selectedSource} />}
      </form>

      <nav className="news-desk-desks no-scrollbar" aria-label={pick(locale, 'أبواب التغطية', 'Coverage desks')}>
        <Link href={hrefFor({ desk: 'all', page: 1 })} className={`news-desk-chip ${selectedDesk === 'all' ? 'is-active' : ''}`}>
          {pick(locale, 'كل الأبواب', 'All desks')}
        </Link>
        {deskChips.map((chip) => (
          <Link
            key={chip.key}
            href={hrefFor({ desk: chip.key, page: 1 })}
            className={`news-desk-chip ${selectedDesk === chip.key ? 'is-active' : ''}`}
          >
            {deskLabel(chip.key, locale)}
            <span className="ms-1 opacity-70">{chip.count}</span>
          </Link>
        ))}
      </nav>

      {sources.length > 1 ? (
        <nav className="news-desk-desks no-scrollbar border-t border-border/70 pt-2" aria-label={pick(locale, 'المصادر', 'Sources')}>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {pick(locale, 'المصدر', 'Source')}
          </span>
          <Link href={hrefFor({ source: 'all', page: 1 })} className={`news-desk-chip ${selectedSource === 'all' ? 'is-active' : ''}`}>
            {pick(locale, 'الكل', 'All')}
          </Link>
          {sources.map((source) => (
            <Link
              key={source.name}
              href={hrefFor({ source: source.name, page: 1 })}
              className={`news-desk-chip ${selectedSource === source.name ? 'is-active' : ''}`}
            >
              {source.name} ({source.count})
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
