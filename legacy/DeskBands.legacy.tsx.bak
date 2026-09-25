import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { DeskRule } from '@/components/news/NewsOrnaments';
import { pick } from '@/i18n/pick';
import type { ArchiveDay, Broadcast, GoalMoment, TableSnapshot } from '@/lib/news/load-desk';
import { Goal, Radio, Tv, Trophy } from 'lucide-react';

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
    <div className="news-section-head">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500">{kicker}</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.7rem]">{title}</h2>
        <DeskRule className="news-section-ornament" />
      </div>
      {action && (
        <Link href={action.href} className="news-band-action">
          {action.label}
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
    <section className="news-band">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'الجداول', 'The tables')}
        title={pick(locale, 'الترتيب من المصدر', 'Standings from the source')}
        action={{ href: '/leagues', label: pick(locale, 'كل البطولات', 'All leagues') }}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {tables.map((table) => (
          <article key={table.league.id} className="news-table-card">
            <header className="news-table-head">
              {table.league.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={table.league.logoUrl} alt="" className="h-7 w-7 object-contain" />
              ) : (
                <Trophy className="h-5 w-5 text-orange-500" />
              )}
              <div className="min-w-0">
                <Link href={`/league/${table.league.slug}`} className="news-table-title">
                  {table.league.name}
                </Link>
                {table.league.country && <span className="news-table-country">{table.league.country}</span>}
              </div>
            </header>
            <table className="news-table">
              <thead>
                <tr>
                  <th scope="col" className="text-center">
                    #
                  </th>
                  <th scope="col">{pick(locale, 'الفريق', 'Team')}</th>
                  <th scope="col" className="text-center">
                    {pick(locale, 'لعب', 'P')}
                  </th>
                  <th scope="col" className="text-center">
                    {pick(locale, '+/-', 'GD')}
                  </th>
                  <th scope="col" className="text-center">
                    {pick(locale, 'نقاط', 'Pts')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={`${table.league.id}-${row.team.slug}`}>
                    <td className="news-table-rank">{row.rank}</td>
                    <th scope="row">
                      <Link href={`/team/${row.team.slug}`} className="news-table-team">
                        {row.team.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.team.logoUrl} alt="" className="h-4 w-4 object-contain" />
                        ) : null}
                        <span className="truncate">{row.team.name}</span>
                      </Link>
                    </th>
                    <td className="text-center tabular-nums">{row.played}</td>
                    <td className="text-center tabular-nums">
                      {row.goalsFor - row.goalsAgainst > 0 ? '+' : ''}
                      {row.goalsFor - row.goalsAgainst}
                    </td>
                    <td className="news-table-points">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Real MatchEvent rows — the goals behind the scores on the wire. */
export function GoalsBand({ goals, locale }: { goals: GoalMoment[]; locale: string }) {
  if (goals.length === 0) return null;

  return (
    <section className="news-band">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'الشباك', 'The net')}
        title={pick(locale, 'آخر الأهداف', 'Latest goals')}
        action={{ href: '/matches', label: pick(locale, 'كل المباريات', 'All matches') }}
      />
      <ol className="news-goal-grid">
        {goals.map((goal) => (
          <li key={goal.id}>
            <Link href={`/match/${goal.matchId}`} className="news-goal">
              <span className="news-goal-minute">
                {goal.minute}
                {goal.extraMinute ? `+${goal.extraMinute}` : ''}
                <small>′</small>
              </span>
              <div className="min-w-0 flex-1">
                <strong className="news-goal-scorer">
                  <Goal className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                  <span className="truncate">{goal.playerName || pick(locale, 'هدف', 'Goal')}</span>
                </strong>
                {goal.assistName && (
                  <span className="news-goal-assist">
                    {pick(locale, 'صناعة', 'Assist')}: {goal.assistName}
                  </span>
                )}
                <span className="news-goal-fixture">
                  {goal.homeTeam.name} <b>{goal.homeScore ?? '–'}</b>
                  <i>–</i>
                  <b>{goal.awayScore ?? '–'}</b> {goal.awayTeam.name}
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
    <section className="news-band">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'الإرسال', 'Transmission')}
        title={pick(locale, 'أين تشاهد اليوم', 'Where to watch today')}
        action={{ href: '/live', label: pick(locale, 'يلا سبورت مباشر', 'Yalla Sport Live') }}
      />
      <div className="news-broadcast-grid">
        {broadcasts.map((row) => {
          const live = row.status === 'LIVE' || row.status === 'HALFTIME';
          return (
            <article key={row.matchId} className="news-broadcast">
              <Link href={`/match/${row.matchId}`} className="news-broadcast-fixture">
                <span className="news-broadcast-side">
                  {row.homeTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.homeTeam.logoUrl} alt="" />
                  ) : null}
                  <span className="truncate">{row.homeTeam.name}</span>
                </span>
                <span className="news-broadcast-clock">
                  {live ? (
                    <span className="news-broadcast-live">
                      <Radio className="h-3 w-3" />
                      {pick(locale, 'مباشر', 'Live')}
                    </span>
                  ) : (
                    <ClientTime value={row.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                  )}
                </span>
                <span className="news-broadcast-side is-away">
                  <span className="truncate">{row.awayTeam.name}</span>
                  {row.awayTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.awayTeam.logoUrl} alt="" />
                  ) : null}
                </span>
              </Link>
              {row.league && <p className="news-broadcast-league">{row.league.name}</p>}
              <div className="news-broadcast-channels">
                <Tv className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                {row.channels.map((channel) => (
                  <span key={channel.id} className="news-broadcast-channel">
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
    <section className="news-band">
      <BandHead
        locale={locale}
        kicker={pick(locale, 'الأرشيف', 'The archive')}
        title={pick(locale, 'إيقاع الأسبوع', 'The week in filings')}
        action={{ href: hrefFor({ desk: 'all', source: 'all', page: 1, day: null }), label: pick(locale, 'الأخبار الحديثة', 'Latest news') }}
      />
      <ol className="news-archive">
        {[...archive].reverse().map((day) => (
          <li key={day.key} className="news-archive-day">
            <Link href={hrefFor({ day: day.key, page: 1 })} className="news-archive-link">
              <span className="news-archive-bar" style={{ height: `${Math.max(12, (day.count / peak) * 100)}%` }}>
                <b>{day.count}</b>
              </span>
              <ClientTime value={day.date} options={{ weekday: 'short', day: 'numeric' }} className="news-archive-label" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
