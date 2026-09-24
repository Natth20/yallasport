import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { DeskRule, EditionPlate } from '@/components/news/NewsOrnaments';
import { TicketBarcode } from '@/components/decor/CraftMarks';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { DeskChip, DeskStats, PitchMatch, SourceTally } from '@/lib/news/load-desk';
import { ChevronLeft, Radio, Search } from 'lucide-react';

/** Live and same-day fixtures, running above the masthead like a wire feed. */
export function EditionWire({ matches, locale }: { matches: PitchMatch[]; locale: string }) {
  return (
    <div className="news-wire border-b border-white/[0.06] bg-[#0c121e]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-2 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-orange-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
          </span>
          {pick(locale, 'سلك الملعب المباشر', 'Live Match Wire')}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto no-scrollbar">
          {matches.map((match) => {
            const live = match.status === 'LIVE' || match.status === 'HALFTIME';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="group flex shrink-0 items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-white/80 transition-all hover:border-orange-500/40 hover:bg-orange-500/[0.06] hover:text-orange-300"
              >
                {/* Home Team */}
                <div className="flex items-center gap-1.5 max-w-[7.5rem]">
                  {match.homeTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.homeTeam.logoUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                  ) : null}
                  <span className="truncate">{match.homeTeam.name}</span>
                </div>

                {/* Score / Time */}
                {live ? (
                  <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                    {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                      ? `${match.homeScore} - ${match.awayScore}`
                      : 'LIVE'}
                    {match.minute ? <span className="text-[9px] text-red-200">({match.minute}&apos;)</span> : null}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-medium text-orange-300/90">
                    <ClientTime value={match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                  </span>
                )}

                {/* Away Team */}
                <div className="flex items-center gap-1.5 max-w-[7.5rem]">
                  <span className="truncate">{match.awayTeam.name}</span>
                  {match.awayTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.awayTeam.logoUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                  ) : null}
                </div>
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
    <Link
      href={`/news/${slug}`}
      className="news-breaking mt-5 group relative flex items-center gap-3 overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-[#131c2e] to-[#0c121e] p-3 shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all hover:border-orange-500/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]"
    >
      {/* Pulse indicators: vital orange & green pulse */}
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        </span>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f97316] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f97316]" />
        </span>
      </div>

      <span className="rounded-md bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-red-300">
        {pick(locale, 'عاجل الآن', 'BREAKING FLASH')}
      </span>

      <strong className="min-w-0 flex-1 truncate text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
        {title}
      </strong>

      {publishedAt && (
        <span className="hidden sm:inline-flex shrink-0 items-center rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-orange-400">
          <ClientTime value={publishedAt} />
        </span>
      )}

      <ChevronLeft className="ms-auto h-4 w-4 shrink-0 text-orange-400 transition-transform group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px] rtl:rotate-180" />
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
    <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-card/50 p-4 sm:p-6 backdrop-blur-2xl shadow-xl">
      {/* Search Input Bar */}
      <form method="get" className="relative flex items-center">
        <span className="absolute start-4 text-primary">
          <Search className="h-4 w-4" />
        </span>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={pick(locale, 'ابحث في الأخبار والتقارير الرياضية المعتمدة...', 'Search verified sports stories & transfers...')}
          className="w-full rounded-2xl border border-white/10 bg-background/80 py-3.5 pe-4 ps-11 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground shadow-inner backdrop-blur-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {selectedDesk !== 'all' && <input type="hidden" name="desk" value={selectedDesk} />}
        {selectedSource !== 'all' && <input type="hidden" name="source" value={selectedSource} />}
      </form>

      {/* Category Pills */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label={pick(locale, 'أبواب التغطية', 'Coverage desks')}>
        <Link
          href={hrefFor({ desk: 'all', page: 1 })}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black transition-all ${
            selectedDesk === 'all'
              ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
              : 'border border-white/10 bg-white/5 text-muted-foreground hover:border-primary/40 hover:bg-white/10 hover:text-foreground'
          }`}
        >
          {pick(locale, '⚡ جميع الأخبار', '⚡ All News')}
        </Link>
        {deskChips.map((chip) => (
          <Link
            key={chip.key}
            href={hrefFor({ desk: chip.key, page: 1 })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              selectedDesk === chip.key
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                : 'border border-white/10 bg-white/5 text-muted-foreground hover:border-primary/40 hover:bg-white/10 hover:text-foreground'
            }`}
          >
            <span>{deskLabel(chip.key, locale)}</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedDesk === chip.key ? 'bg-white/20 text-white' : 'bg-foreground/10 text-muted-foreground'}`}>
              {chip.count}
            </span>
          </Link>
        ))}
      </nav>

      {/* Sources Pills */}
      {sources.length > 1 && (
        <nav className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-white/5 no-scrollbar" aria-label={pick(locale, 'المصادر', 'Sources')}>
          <span className="text-[11px] font-bold text-muted-foreground shrink-0">{pick(locale, 'المصدر:', 'Source:')}</span>
          <Link
            href={hrefFor({ source: 'all', page: 1 })}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              selectedSource === 'all' ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {pick(locale, 'الكل', 'All')}
          </Link>
          {sources.map((source) => (
            <Link
              key={source.name}
              href={hrefFor({ source: source.name, page: 1 })}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                selectedSource === source.name ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {source.name} ({source.count})
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
