import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { DeskRule, EditionPlate } from '@/components/news/NewsOrnaments';
import { TicketBarcode } from '@/components/decor/CraftMarks';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { DeskChip, DeskStats, PitchMatch, SourceTally } from '@/lib/news/load-desk';
import { ChevronLeft, ChevronRight, Search, Radio, Flame } from 'lucide-react';

/** Live and same-day fixtures from the sports API sync — newest first, never invented. */
export function EditionWire({ matches, locale }: { matches: PitchMatch[]; locale: string }) {
  const liveCount = matches.filter((match) => match.status === 'LIVE' || match.status === 'HALFTIME').length;
  const label =
    liveCount > 0
      ? pick(locale, 'سلك الملعب المباشر', 'Live Match Wire')
      : pick(locale, 'سلك الملعب · أحدث الركلات', 'Pitch wire · latest kickoffs');

  return (
    <div className="border-b border-border/80 bg-card/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2 sm:px-6">
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>{label}</span>
          {liveCount > 0 ? (
            <em className="not-italic rounded bg-red-500 px-1 text-[9px] font-extrabold text-white">
              {liveCount} {pick(locale, 'الآن', 'live')}
            </em>
          ) : null}
        </div>
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          {matches.map((match) => {
            const live = match.status === 'LIVE' || match.status === 'HALFTIME';
            const hasScore = typeof match.homeScore === 'number' && typeof match.awayScore === 'number';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className={`group flex shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-3 py-1.5 text-xs font-semibold transition-all hover:border-primary hover:bg-primary/5 ${
                  live ? 'border-primary/40 bg-primary/5' : ''
                }`}
              >
                {match.league?.name ? (
                  <span className="hidden text-[9px] font-extrabold uppercase text-muted-foreground sm:inline">
                    {match.league.name}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5 font-bold">
                  {match.homeTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.homeTeam.logoUrl} alt="" className="h-4 w-4 object-contain" />
                  ) : null}
                  <span className="truncate max-w-[80px]">{match.homeTeam.name}</span>
                </span>
                {live ? (
                  <span className="flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-black text-red-500 tabular-nums">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    {hasScore ? `${match.homeScore}–${match.awayScore}` : pick(locale, 'مباشر', 'LIVE')}
                    {match.minute ? <small className="text-[8px] font-bold">({match.minute}′)</small> : null}
                  </span>
                ) : (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums">
                    <ClientTime value={match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="truncate max-w-[80px]">{match.awayTeam.name}</span>
                  {match.awayTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.awayTeam.logoUrl} alt="" className="h-4 w-4 object-contain" />
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
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 mt-4">
      {cells.map((cell) => (
        <div key={cell.label} className="rounded-xl border border-border/70 bg-card/60 p-3 text-center">
          <dt className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{cell.label}</dt>
          <dd className="mt-1 text-base font-black tabular-nums text-foreground">
            {cell.value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
          </dd>
        </div>
      ))}
      {stats.latestAt && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-6 rounded-xl border border-primary/20 bg-primary/5 p-2 text-center text-xs font-bold text-primary">
          <dt className="inline me-2 text-[10px] uppercase tracking-wider">{pick(locale, 'آخر تحديث', 'Last filed')}:</dt>
          <dd className="inline font-black tabular-nums">
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
    <header className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <EditionPlate year={year} label={pick(locale, 'العدد', 'Issue')} />
          <div>
            <p className="text-2xl font-black tracking-tight text-foreground">
              Yalla <span className="text-primary">Desk</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.26em]">
              <span className="inline-flex items-center gap-1.5 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {pick(locale, 'غرفة الأخبار', 'News desk')}
              </span>
              <span className="text-muted-foreground">
                <ClientTime value={now} options={{ weekday: 'long', day: 'numeric', month: 'long' }} />
              </span>
            </div>
          </div>
        </div>
        <div className="max-w-sm sm:text-end">
          <TicketBarcode className="mb-2 ms-auto text-muted-foreground/40" />
          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            {pick(
              locale,
              'من المصدر، بعد اعتماد التحرير فقط — بلا ضجيج ولا عناوين بلا أصل.',
              'From the source, after desk approval only — no noise, no sourceless headlines.'
            )}
          </p>
        </div>
      </div>
      <EditionLedger stats={stats} locale={locale} />
      <DeskRule className="mt-4" />
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
    <Link
      href={`/news/${slug}`}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-foreground transition-all hover:border-red-500/60 hover:bg-red-500/15 shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-red-500 px-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
          <Flame className="h-3.5 w-3.5 animate-bounce" />
          {pick(locale, 'عاجل', 'Breaking')}
        </span>
        <strong className="truncate text-sm font-black text-foreground group-hover:text-red-500 transition-colors">
          {title}
        </strong>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-muted-foreground">
        {publishedAt ? (
          <span className="hidden sm:inline">
            <ClientTime value={publishedAt} />
          </span>
        ) : null}
        <ChevronRight className="h-4 w-4 text-red-500 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      </div>
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
    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-sm">
      <form method="get" className="relative">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-primary">
          <Search className="h-4 w-4" />
        </span>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={pick(locale, 'ابحث في التقارير المعتمدة…', 'Search approved reports…')}
          className="w-full rounded-xl border border-border bg-background py-2.5 ps-10 pe-4 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
        />
        {selectedDesk !== 'all' && <input type="hidden" name="desk" value={selectedDesk} />}
        {selectedSource !== 'all' && <input type="hidden" name="source" value={selectedSource} />}
      </form>

      <nav className="flex flex-wrap items-center gap-1.5" aria-label={pick(locale, 'أبواب التغطية', 'Coverage desks')}>
        <Link
          href={hrefFor({ desk: 'all', page: 1 })}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            selectedDesk === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'border border-border/80 bg-card/80 text-foreground hover:border-primary'
          }`}
        >
          {pick(locale, 'كل الأبواب', 'All desks')}
        </Link>
        {deskChips.map((chip) => {
          const isSelected = selectedDesk === chip.key;
          return (
            <Link
              key={chip.key}
              href={hrefFor({ desk: chip.key, page: 1 })}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border/80 bg-card/80 text-foreground hover:border-primary'
              }`}
            >
              <span>{deskLabel(chip.key, locale)}</span>
              <span className={`text-[10px] tabular-nums ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {chip.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {sources.length > 1 ? (
        <nav className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3" aria-label={pick(locale, 'المصادر', 'Sources')}>
          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground me-1">
            {pick(locale, 'المصدر', 'Source')}:
          </span>
          <Link
            href={hrefFor({ source: 'all', page: 1 })}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              selectedSource === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border/70 bg-card/70 text-foreground hover:border-primary'
            }`}
          >
            {pick(locale, 'الكل', 'All')}
          </Link>
          {sources.map((source) => {
            const isSelected = selectedSource === source.name;
            return (
              <Link
                key={source.name}
                href={hrefFor({ source: source.name, page: 1 })}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border/70 bg-card/70 text-foreground hover:border-primary'
                }`}
              >
                <span>{source.name}</span>
                <span className={`text-[9px] tabular-nums ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  ({source.count})
                </span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
