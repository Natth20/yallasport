import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import type { ArchiveDay, Broadcast, GoalMoment, TableSnapshot } from '@/lib/news/load-desk';
import { Goal, Radio, Tv, Trophy, ChevronRight } from 'lucide-react';

export function BandHead({
  kicker,
  title,
  action,
  locale,
}: {
  kicker: string;
  title: string;
  action?: { href: string; label: string };
  locale: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{kicker}</p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl">{title}</h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:opacity-80"
        >
          {action.label}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      )}
      <span className="sr-only">{locale}</span>
    </div>
  );
}

/** Real Standing rows for the competitions we actually hold a table for. */
export function TablesBand({ tables, locale }: { tables: TableSnapshot[]; locale: string }) {
  if (tables.length === 0) return null;

  return (
    <section className="mt-12 min-w-0">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'الجداول والترتيب', 'Tables & standings')}
        title={pick(locale, 'الترتيب من المصدر', 'Standings from the source')}
        action={{ href: '/leagues', label: pick(locale, 'عرض كل البطولات', 'All leagues') }}
      />
      <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => {
          const leader = table.rows[0];
          return (
            <article
              key={table.league.id}
              className="group min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-md shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <header className="flex items-center justify-between gap-3 border-b border-border/60 p-4 bg-muted/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background border border-border/80 p-1.5 shadow-xs">
                    {table.league.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={table.league.logoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Trophy className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/league/${table.league.slug}`}
                      className="block truncate text-xs font-black text-foreground hover:text-primary transition-colors"
                    >
                      <bdi dir="auto">{table.league.name}</bdi>
                    </Link>
                    {table.league.country && (
                      <span className="block text-[10px] font-semibold text-muted-foreground">{table.league.country}</span>
                    )}
                  </div>
                </div>
                {leader && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-400">
                    👑 {leader.team.name}
                  </span>
                )}
              </header>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] font-black text-muted-foreground bg-muted/10">
                      <th scope="col" className="px-3 py-2 text-center w-8">#</th>
                      <th scope="col" className="px-2 py-2 text-start">{pick(locale, 'الفريق', 'Team')}</th>
                      <th scope="col" className="px-2 py-2 text-center">{pick(locale, 'لعب', 'P')}</th>
                      <th scope="col" className="px-2 py-2 text-center">{pick(locale, '+/-', 'GD')}</th>
                      <th scope="col" className="px-3 py-2 text-center font-bold text-foreground">{pick(locale, 'نقاط', 'Pts')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-medium">
                    {table.rows.map((row) => {
                      const isFirst = row.rank === 1;
                      const isTop3 = row.rank <= 3;
                      return (
                        <tr
                          key={`${table.league.id}-${row.team.slug}`}
                          className={`transition-colors hover:bg-primary/5 ${isFirst ? 'bg-amber-500/[0.03]' : ''}`}
                        >
                          <td className="px-3 py-2.5 text-center font-black tabular-nums">
                            {isFirst ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 shadow-xs">
                                1
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                                {row.rank}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">{row.rank}</span>
                            )}
                          </td>
                          <th scope="row" className="px-2 py-2.5 font-normal text-start">
                            <Link
                              href={`/team/${row.team.slug}`}
                              className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors"
                            >
                              {row.team.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={row.team.logoUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                              ) : null}
                              <span className="truncate max-w-[130px] text-xs">
                                <bdi dir="auto">{row.team.name}</bdi>
                              </span>
                            </Link>
                          </th>
                          <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{row.played}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                            {row.goalsFor - row.goalsAgainst > 0 ? '+' : ''}
                            {row.goalsFor - row.goalsAgainst}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 font-black tabular-nums text-primary text-xs">
                              {row.points}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Real MatchEvent rows — the goals behind the scores on the wire. */
export function GoalsBand({ goals, locale }: { goals: GoalMoment[]; locale: string }) {
  if (goals.length === 0) return null;

  return (
    <section className="mt-10 min-w-0">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'الشباك', 'The net')}
        title={pick(locale, 'آخر الأهداف', 'Latest goals')}
        action={{ href: '/matches', label: pick(locale, 'كل المباريات', 'All matches') }}
      />
      <ol className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <li key={goal.id}>
            <Link
              href={`/match/${goal.matchId}`}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3.5 backdrop-blur-sm shadow-sm transition-all hover:border-primary hover:bg-primary/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-black text-primary text-xs tabular-nums">
                {goal.minute}
                {goal.extraMinute ? `+${goal.extraMinute}` : ''}′
              </span>
              <div className="min-w-0 flex-1">
                <strong className="flex items-center gap-1.5 text-xs font-black text-foreground group-hover:text-primary transition-colors">
                  <Goal className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{goal.playerName || pick(locale, 'هدف', 'Goal')}</span>
                </strong>
                {goal.assistName && (
                  <span className="block truncate text-[10px] font-semibold text-muted-foreground">
                    {pick(locale, 'صناعة', 'Assist')}: {goal.assistName}
                  </span>
                )}
                <span className="mt-0.5 block truncate text-[10px] font-bold text-muted-foreground">
                  {goal.homeTeam.name} <b className="text-foreground">{goal.homeScore ?? '–'}</b> - <b className="text-foreground">{goal.awayScore ?? '–'}</b> {goal.awayTeam.name}
                </span>
              </div>
              {goal.scoringTeam?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={goal.scoringTeam.logoUrl} alt="" className="h-6 w-6 shrink-0 object-contain" />
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Real MatchChannel rows — where today's fixtures are actually carried. */
export function BroadcastBand({ broadcasts, locale }: { broadcasts: Broadcast[]; locale: string }) {
  if (broadcasts.length === 0) return null;

  return (
    <section className="mt-12 min-w-0">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'البث والتغطية', 'Broadcast & transmission')}
        title={pick(locale, 'أين تشاهد اليوم', 'Where to watch today')}
        action={{ href: '/live', label: pick(locale, 'يلا سبورت مباشر', 'Yalla Sport Live') }}
      />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {broadcasts.map((row) => {
          const live = row.status === 'LIVE' || row.status === 'HALFTIME';
          return (
            <article
              key={row.matchId}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/90 to-card/50 p-4.5 backdrop-blur-md shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              {/* Competition header */}
              {row.league && (
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5 mb-3.5">
                  <span className="truncate text-[11px] font-bold text-muted-foreground">
                    <bdi dir="auto">{row.league.name}</bdi>
                  </span>
                  {live ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-black text-red-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                      {pick(locale, 'مباشر الآن', 'Live now')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <ClientTime value={row.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                    </span>
                  )}
                </div>
              )}

              {/* Match Teams VS */}
              <Link href={`/match/${row.matchId}`} className="flex items-center justify-between gap-3 py-1">
                {/* Home */}
                <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background border border-border/70 p-2 shadow-xs group-hover:border-primary/40 transition-colors">
                    {row.homeTeam.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.homeTeam.logoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{row.homeTeam.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <span className="truncate w-full text-xs font-black text-foreground group-hover:text-primary transition-colors">
                    <bdi dir="auto">{row.homeTeam.name}</bdi>
                  </span>
                </div>

                {/* Center Badge */}
                <div className="shrink-0 flex flex-col items-center justify-center px-2">
                  <span className="rounded-xl bg-muted/60 border border-border/60 px-2.5 py-1 text-[11px] font-black tabular-nums text-foreground">
                    {live ? (
                      <span className="text-red-500 font-black animate-pulse">VS</span>
                    ) : (
                      pick(locale, 'ضد', 'VS')
                    )}
                  </span>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background border border-border/70 p-2 shadow-xs group-hover:border-primary/40 transition-colors">
                    {row.awayTeam.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.awayTeam.logoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{row.awayTeam.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <span className="truncate w-full text-xs font-black text-foreground group-hover:text-primary transition-colors">
                    <bdi dir="auto">{row.awayTeam.name}</bdi>
                  </span>
                </div>
              </Link>

              {/* Channels list */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3">
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-muted-foreground me-1">
                  <Tv className="h-3 w-3 text-primary" />
                  {pick(locale, 'القنوات الناقلة:', 'Channels:')}
                </span>
                {row.channels.map((channel) => (
                  <span
                    key={channel.id}
                    className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary shadow-2xs"
                  >
                    {channel.name}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Real publishedAt counts, so the reader can see the desk's rhythm. */
export function ArchiveStrip({
  archive,
  locale,
  hrefFor,
}: {
  archive: ArchiveDay[];
  locale: string;
  hrefFor: (next: { q?: string; desk?: string; source?: string; page?: number; day?: string | null }) => string;
}) {
  if (archive.length === 0) return null;
  const peak = Math.max(...archive.map((day) => day.count), 1);

  return (
    <section className="mt-10">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'الأرشيف', 'The archive')}
        title={pick(locale, 'إيقاع الأسبوع', 'The week in filings')}
        action={{ href: hrefFor({ desk: 'all', source: 'all', page: 1, day: null }), label: pick(locale, 'الأخبار الحديثة', 'Latest news') }}
      />
      <ol className="flex items-end justify-between gap-2 overflow-x-auto pb-2">
        {[...archive].reverse().map((day) => (
          <li key={day.key} className="min-w-[60px] flex-1 text-center">
            <Link
              href={hrefFor({ day: day.key, page: 1 })}
              className="group flex flex-col items-center gap-2 rounded-xl p-2 transition-colors hover:bg-primary/5"
            >
              <span className="flex h-24 w-full items-end justify-center rounded-lg bg-muted/40 p-1">
                <span
                  className="w-full rounded bg-primary/70 transition-all group-hover:bg-primary"
                  style={{ height: `${Math.max(15, (day.count / peak) * 100)}%` }}
                >
                  <b className="block text-[9px] font-black text-primary-foreground tabular-nums pt-0.5">{day.count}</b>
                </span>
              </span>
              <ClientTime
                value={day.date}
                options={{ weekday: 'short', day: 'numeric' }}
                className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
