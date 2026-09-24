import {Link} from '@/i18n/navigation';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import {getTranslations} from 'next-intl/server';

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
      <div className="flex items-end justify-between gap-3 border-b border-emerald-900/10 px-5 py-4 dark:border-border">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-orange-500">{t('kickoff_clock')}</span>
          <h2 className="mt-1 text-sm font-bold text-foreground dark:text-foreground">{t('daily_rhythm')}</h2>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {t('timeline_fixtures', {count: slots.reduce((total, slot) => total + slot.matches.length, 0)})}
        </span>
      </div>

      <div className="relative px-4 py-5">
        <div className="timeline-pulse pointer-events-none absolute inset-x-8 top-[4.35rem] h-px" />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {slots.map((slot) => {
            const active = activeHour === slot.hour;
            const hourLabel = (
              <span className={`text-[11px] font-bold tabular-nums ${
                active ? 'text-white' : slot.isNow ? 'text-orange-600' : 'text-muted-foreground'
              }`}>
                {slot.label}
              </span>
            );
            return (
              <div
                key={slot.hour}
                className={`relative flex min-w-[108px] flex-1 flex-col rounded-2xl border px-2.5 py-3 ${
                  active
                    ? 'border-orange-500/50 bg-orange-500 text-primary-foreground'
                    : slot.isNow
                      ? 'border-orange-500/40 bg-orange-50/80 dark:border-orange-500/30 dark:bg-orange-500/10'
                      : 'border-transparent bg-muted/80 dark:bg-card/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {hrefForHour ? (
                    <Link href={hrefForHour(slot.hour)} className="hover:underline">
                      {hourLabel}
                    </Link>
                  ) : hourLabel}
                  {slot.isNow && (
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${active ? 'text-white/80' : 'text-orange-500'}`}>
                      {t('now')}
                    </span>
                  )}
                </div>
                <div
                  className={`mt-3 h-1.5 overflow-hidden rounded-full ${active ? 'bg-white/25' : 'bg-slate-200/80 dark:bg-muted/10'}`}
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-full ${active ? 'bg-card' : slot.isNow ? 'bg-orange-500' : 'bg-slate-400 dark:bg-white/30'}`}
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
                        title={t('versus', {home: match.homeTeam.name, away: match.awayTeam.name})}
                        className={`flex items-center gap-1.5 rounded-lg px-1 py-0.5 transition-colors ${
                          active
                            ? 'hover:bg-white/10'
                            : live
                              ? 'bg-red-50 hover:bg-card dark:bg-red-500/10 dark:hover:bg-muted'
                              : 'hover:bg-card dark:hover:bg-muted'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            live ? 'animate-pulse bg-red-500' : match.status === 'FINISHED' ? 'bg-slate-300' : 'bg-orange-400'
                          }`}
                        />
                        <span className={`truncate text-[9px] font-semibold ${
                          active
                            ? 'text-primary-foreground'
                            : live
                              ? 'font-black text-red-600 dark:text-red-300'
                              : 'text-foreground dark:text-muted-foreground'
                        }`}>
                          {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                            ? `${match.homeScore}:${match.awayScore} ${match.homeTeam.name} × ${match.awayTeam.name}`
                            : `${match.homeTeam.name} × ${match.awayTeam.name}`}
                        </span>
                      </Link>
                    );
                  })}
                  {slot.matches.length > 4 && (
                    <span className={`block px-1 text-[8px] font-semibold ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {t('more_matches', {count: slot.matches.length - 4})}
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
