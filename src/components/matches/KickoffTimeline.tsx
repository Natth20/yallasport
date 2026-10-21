import { Link } from '@/i18n/navigation';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import { getTranslations } from 'next-intl/server';
import { Clock } from 'lucide-react';

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

  const totalMatches = slots.reduce((total, slot) => total + slot.matches.length, 0);

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-card/90 dark:border-emerald-400/10 dark:bg-muted shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-4 dark:border-border">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">
            {t('kickoff_clock')}
          </span>
          <h2 className="mt-0.5 text-base font-bold text-foreground dark:text-foreground">
            {t('daily_rhythm')}
          </h2>
        </div>
        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 tabular-nums">
          {t('timeline_fixtures', { count: totalMatches })}
        </span>
      </div>

      <div className="p-3.5 flex flex-col gap-3">
        {slots.map((slot) => {
          const active = activeHour === slot.hour;
          return (
            <div
              key={slot.hour}
              className={`rounded-2xl border p-3 transition-all ${
                active
                  ? 'border-orange-500 bg-orange-500/10 dark:bg-orange-500/15 ring-1 ring-orange-500'
                  : slot.isNow
                    ? 'border-orange-500/50 bg-orange-500/5'
                    : 'border-border/70 bg-background/50 hover:border-orange-500/30 hover:bg-card'
              }`}
            >
              {/* Hour Header */}
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  {hrefForHour ? (
                    <Link
                      href={hrefForHour(slot.hour)}
                      className={`text-xs font-black tabular-nums transition-colors hover:text-orange-500 ${
                        active ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'
                      }`}
                    >
                      {slot.label}
                    </Link>
                  ) : (
                    <span className="text-xs font-black tabular-nums text-foreground">
                      {slot.label}
                    </span>
                  )}
                  {slot.isNow && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      {t('now')}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                  {slot.matches.length} {t('matches')}
                </span>
              </div>

              {/* Matches List for this Hour */}
              <div className="mt-2.5 space-y-1.5">
                {slot.matches.map((match) => {
                  const live = match.status === 'LIVE' || match.status === 'HALFTIME';
                  const hasScore = typeof match.homeScore === 'number' && typeof match.awayScore === 'number';
                  return (
                    <Link
                      key={match.id}
                      href={`/match/${match.id}`}
                      className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                        live
                          ? 'bg-red-500/10 hover:bg-red-500/15'
                          : 'bg-muted/40 hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            live
                              ? 'animate-pulse bg-red-500'
                              : match.status === 'FINISHED'
                                ? 'bg-slate-400'
                                : 'bg-orange-400'
                          }`}
                        />
                        <span className="truncate text-[11px] font-bold text-foreground">
                          {match.homeTeam.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold shrink-0">×</span>
                        <span className="truncate text-[11px] font-bold text-foreground">
                          {match.awayTeam.name}
                        </span>
                      </div>
                      <div className="shrink-0 text-start">
                        {hasScore ? (
                          <span className={`text-[11px] font-black tabular-nums ${live ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : live ? (
                          <span className="text-[10px] font-bold text-red-500">
                            {match.minute ? `${match.minute}′` : t('live')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {match.league.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
