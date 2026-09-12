'use client';

import {Link} from '@/i18n/navigation';
import { useLiveStatus } from '@/lib/context/LiveStatusContext';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import {useTranslations} from 'next-intl';

function isLive(status: string) {
  return status === 'LIVE' || status === 'HALFTIME';
}

export function LiveNowBoard({
  seed,
  dayIds,
  lastEvents = {},
}: {
  seed: NormalizedMatch[];
  dayIds: string[];
  lastEvents?: Record<string, string>;
}) {
  const t = useTranslations('sports');
  const { matches: liveFeed } = useLiveStatus();
  const daySet = new Set(dayIds);
  const byKey = new Map<string, NormalizedMatch>();

  for (const match of [...seed, ...liveFeed]) {
    if (!daySet.has(match.id) && !daySet.has(match.externalId)) continue;
    byKey.set(match.id, match);
  }

  const rank = new Map(seed.map((match, index) => [match.id, index]));
  for (const [index, match] of seed.entries()) {
    if (!rank.has(match.externalId)) rank.set(match.externalId, index);
  }

  const liveMatches = Array.from(byKey.values())
    .filter((match) => isLive(match.status))
    .sort((first, second) => {
      const firstRank = rank.get(first.id) ?? rank.get(first.externalId) ?? 80;
      const secondRank = rank.get(second.id) ?? rank.get(second.externalId) ?? 80;
      return firstRank - secondRank;
    })
    .slice(0, 8);
  if (liveMatches.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-red-500/35 shadow-[0_28px_56px_-36px_rgba(220,38,38,0.55)]">
      <div className="matchday-scoreboard px-5 py-4">
        <div className="mb-4 flex items-center justify-between gap-3 text-foreground dark:text-foreground/70">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <div className="matchday-section-kicker">
              <span className="matchday-folio-mark is-light" aria-hidden>
                LIVE
              </span>
              <h2 className="text-sm font-bold text-foreground dark:text-foreground">{t('live_now')}</h2>
            </div>
          </div>
          <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-black tabular-nums text-white">
            {t('live_matches', {count: liveMatches.length})}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {liveMatches.map((match) => {
            const halftime = match.status === 'HALFTIME';
            return (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className={`min-w-[220px] flex-1 rounded-2xl border px-4 py-3.5 text-foreground transition-transform hover:-translate-y-0.5 dark:text-foreground ${
                halftime
                  ? 'border-amber-400/40 bg-amber-500/15'
                  : 'border-red-400/35 bg-red-500/15 ring-1 ring-red-400/30'
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2 text-[9px] font-semibold text-muted-foreground dark:text-foreground/60">
                <span className="truncate">{match.league.name}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black ${
                  halftime ? 'bg-amber-400/25 text-amber-800 dark:text-amber-100' : 'animate-pulse bg-red-500 text-white'
                }`}>
                  {halftime ? t('halftime') : match.minute ? `${t('live')} ${match.minute}'` : t('live')}
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <img src={match.homeTeam.logoUrl || '/placeholder-team.png'} alt="" className="h-7 w-7 object-contain" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-bold">{match.homeTeam.name}</span>
                  <strong className={`text-xl font-black tabular-nums ${halftime ? 'text-amber-700 dark:text-amber-200' : 'text-red-600 dark:text-red-300'}`}>
                    {typeof match.homeScore === 'number' ? match.homeScore : '–'}
                  </strong>
                </div>
                <div className="flex items-center gap-2.5">
                  <img src={match.awayTeam.logoUrl || '/placeholder-team.png'} alt="" className="h-7 w-7 object-contain" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-bold">{match.awayTeam.name}</span>
                  <strong className={`text-xl font-black tabular-nums ${halftime ? 'text-amber-700 dark:text-amber-200' : 'text-red-600 dark:text-red-300'}`}>
                    {typeof match.awayScore === 'number' ? match.awayScore : '–'}
                  </strong>
                </div>
              </div>
              {(lastEvents[match.id] || lastEvents[match.externalId]) && (
                <p className="mt-3 truncate text-[9px] font-medium text-muted-foreground dark:text-foreground/60">
                  {lastEvents[match.id] || lastEvents[match.externalId]}
                </p>
              )}
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
