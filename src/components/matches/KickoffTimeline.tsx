import { Link } from '@/i18n/navigation';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import { getTranslations } from 'next-intl/server';

export type KickoffSlot = {
  hour: number;
  label: string;
  isNow: boolean;
  matches: NormalizedMatch[];
};

export async function KickoffTimeline({
  slots,
  hrefForHour,
  activeHour,
}: {
  slots: KickoffSlot[];
  hrefForHour?: (hour: number) => string;
  activeHour?: number | null;
}) {
  const t = await getTranslations('sports');
  if (slots.length === 0) return null;

  const peak = Math.max(...slots.map((slot) => slot.matches.length), 1);

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-card/90 dark:border-emerald-400/10 dark:bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 px-5 py-4 dark:border-border">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">{t('kickoff_clock')}</span>
          <h2 className="mt-0.5 text-base font-bold text-foreground dark:text-foreground">{t('daily_rhythm')}</h2>
        </div>
        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
          {t('timeline_fixtures', { count: slots.reduce((total, slot) => total + slot.matches.length, 0) })}
        </span>
      </div>

      <div className="relative px-4 py-5">
        <div className="timeline-pulse pointer-events-none absolute inset-x-8 top-[4.35rem] h-px" />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
          {slots.map((slot) => {
            const active = activeHour === slot.hour;
            const hourLabel = (
              <span className={`text-[12px] font-bold tabular-nums ${active ? 'text-white' : slot.isNow ? 'text-orange-600 dark:text-orange-400' : 'text-foreground/80 dark:text-foreground/70'
                }`}>
                {slot.label}
              </span>
            );
            return (
              <div
                key={slot.hour}
                className={`relative flex shrink-0 w-[145px] sm:w-[160px] snap-start flex-col rounded-2xl border p-3 transition-all ${active
                  ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : slot.isNow
                    ? 'border-orange-500/40 bg-orange-50/90 dark:border-orange-500/40 dark:bg-orange-500/15'
                    : 'border-border/80 bg-card/90 dark:border-border/60 dark:bg-card/[0.04]'
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {hrefForHour ? (
                    <Link href={hrefForHour(slot.hour)} className="hover:underline">
                      {hourLabel}
                    </Link>
                  ) : hourLabel}
                  {slot.isNow && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${active ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
                      }`}>
                      {t('now')}
                    </span>
                  )}
                </div>
                <div
                  className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${active ? 'bg-white/25' : 'bg-slate-200/80 dark:bg-muted/30'}`}
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-full transition-all ${active ? 'bg-white' : slot.isNow ? 'bg-orange-500' : 'bg-orange-400 dark:bg-orange-400/70'}`}
                    style={{ width: `${Math.max(18, (slot.matches.length / peak) * 100)}%` }}
                  />
                </div>
                <div className="mt-3 space-y-1.5">
                  {slot.matches.slice(0, 4).map((match) => {
                    const live = match.status === 'LIVE' || match.status === 'HALFTIME';
                    return (
                      <Link
                        key={match.id}
                        href={`/match/${match.id}`}
                        title={t('versus', { home: match.homeTeam.name, away: match.awayTeam.name })}
                        className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors ${active
                          ? 'hover:bg-white/10'
                          : live
                            ? 'bg-red-50 hover:bg-card dark:bg-red-500/10 dark:hover:bg-muted'
                            : 'hover:bg-card dark:hover:bg-muted'
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${live ? 'animate-pulse bg-red-500' : match.status === 'FINISHED' ? 'bg-slate-400' : 'bg-orange-400'
                            }`}
                        />
                        <span className={`truncate text-[10px] font-semibold ${active
                          ? 'text-white'
                          : live
                            ? 'font-black text-red-600 dark:text-red-300'
                            : 'text-foreground dark:text-muted-foreground'
                          }`}>
                          {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                            ? `${slot.label} — ${match.homeTeam.name} ${match.homeScore} × ${match.awayScore} ${match.awayTeam.name}`
                            : `${slot.label} — ${match.homeTeam.name} × ${match.awayTeam.name}`}
                        </span>
                      </Link>
                    );
                  })}
                  {slot.matches.length > 4 && (
                    <span className={`block px-1 text-[9px] font-bold ${active ? 'text-white/80' : 'text-orange-500'}`}>
                      {t('more_matches', { count: slot.matches.length - 4 })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
