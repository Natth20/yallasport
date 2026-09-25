import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { PitchWatermark } from '@/components/decor/CraftMarks';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { Brief, PitchMatch, SourceTally, TeamInNews } from '@/lib/news/load-desk';
import { Radio } from 'lucide-react';

export function MostReadRail({ articles, locale }: { articles: Brief[]; locale: string }) {
  return (
    <div className="news-circulation">
      <div className="border-b border-white/10 px-5 py-4 ps-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400">
          {pick(locale, 'التداول', 'Circulation')}
        </p>
        <h2 className="mt-1 text-base font-bold text-foreground">{pick(locale, 'الأكثر قراءة', 'Most read')}</h2>
      </div>
      {articles.length > 0 ? (
        <ol className="divide-y divide-white/5">
          {articles.map((article, index) => (
            <li key={article.id}>
              <Link href={`/news/${article.slug}`} className="flex gap-3 px-5 py-3.5 hover:bg-card/[0.04]">
                <span className="w-6 shrink-0 text-lg font-black tabular-nums text-orange-400/80">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <strong className="block text-[13px] font-bold leading-6 text-foreground">{article.title}</strong>
                  <span className="mt-0.5 block text-[10px] font-semibold text-muted-foreground">
                    {deskLabel(article.category, locale)}
                    {article.views > 0 && ` · ${article.views} ${pick(locale, 'مشاهدة', 'views')}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="news-ghost-line px-5 py-5">
          {['01', '02', '03', '04', '05'].map((folio) => (
            <div key={folio} className="flex items-center gap-3 py-2.5">
              <span className="w-6 text-sm text-muted-foreground">{folio}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          ))}
          <p className="pt-2 text-[11px] text-muted-foreground">
            {pick(locale, 'بانتظار التداول — لا تقارير معتمدة بعد.', 'Awaiting circulation — no approved reports yet.')}
          </p>
        </div>
      )}
    </div>
  );
}

/** Who the desk actually quotes, counted from the stories on file. */
export function SourceLedger({
  sources,
  locale,
  selected,
  hrefFor,
}: {
  sources: SourceTally[];
  locale: string;
  selected: string;
  hrefFor: (next: { q?: string; desk?: string; source?: string; page?: number }) => string;
}) {
  if (sources.length === 0) return null;
  const peak = Math.max(...sources.map((source) => source.count), 1);

  return (
    <div className="news-rail-panel">
      <div className="news-rail-head">
        <p className="news-rail-kicker">{pick(locale, 'السجل', 'The ledger')}</p>
        <h2 className="news-rail-title">{pick(locale, 'من أين تأتي الأخبار', 'Where the news comes from')}</h2>
      </div>
      <ul className="news-ledger-list">
        {sources.map((source) => (
          <li key={source.name}>
            <Link
              href={hrefFor({ source: selected === source.name ? 'all' : source.name, page: 1 })}
              className={`news-ledger-row ${selected === source.name ? 'is-active' : ''}`}
            >
              <span className="news-ledger-name">
                {source.name}
                <small>{source.locales.map((code) => (code === 'ar' ? 'ع' : 'EN')).join(' · ')}</small>
              </span>
              <span className="news-ledger-meter" aria-hidden>
                <span style={{ width: `${(source.count / peak) * 100}%` }} />
              </span>
              <span className="news-ledger-count">{source.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Teams the stories actually mention, via confirmed NewsEntityLink rows. */
export function TeamsInNewsRail({ teams, locale }: { teams: TeamInNews[]; locale: string }) {
  if (teams.length === 0) return null;

  return (
    <div className="news-rail-panel">
      <div className="news-rail-head">
        <p className="news-rail-kicker">{pick(locale, 'الأسماء', 'The names')}</p>
        <h2 className="news-rail-title">{pick(locale, 'فرق في الأخبار', 'Teams in the news')}</h2>
      </div>
      <div className="news-team-cloud">
        {teams.map((team) => (
          <Link key={team.id} href={`/team/${team.slug}`} className="news-team-chip">
            {team.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={team.logoUrl} alt="" />
            ) : null}
            <span className="truncate">{team.name}</span>
            <b>{team.count}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PitchPanel({ matches, locale }: { matches: PitchMatch[]; locale: string }) {
  return (
    <div className="news-pitch-panel">
      <PitchWatermark className="pointer-events-none absolute -end-6 top-10 h-28 w-44 text-orange-500/[0.08]" />
      <div className="relative flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-500">
            {pick(locale, 'الملعب', 'The pitch')}
          </p>
          <h2 className="mt-1 text-base font-bold text-foreground">
            {pick(locale, 'اليوم من المصدر', 'Today from the source')}
          </h2>
        </div>
        <Link href="/matches" className="text-[10px] font-bold text-orange-500 hover:underline">
          {pick(locale, 'الجدول', 'Fixtures')}
        </Link>
      </div>
      {matches.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {matches.slice(0, 8).map((match) => {
            const live = match.status === 'LIVE' || match.status === 'HALFTIME';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-orange-50/40 dark:hover:bg-card/[0.04]"
              >
                <TeamMark name={match.homeTeam.name} logo={match.homeTeam.logoUrl} />
                <div className="min-w-0 flex-1 text-center">
                  {live ? (
                    <span className="block text-[13px] font-bold tabular-nums text-foreground">
                      {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                        ? `${match.homeScore}–${match.awayScore}`
                        : '—'}
                    </span>
                  ) : (
                    <ClientTime
                      value={match.kickoffAt}
                      className="block text-[12px] font-bold tabular-nums text-orange-500"
                    />
                  )}
                  <span className="mt-0.5 flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                    {live && <Radio className="h-2.5 w-2.5 text-red-500" />}
                    {live
                      ? `${pick(locale, 'مباشر', 'Live')}${match.minute ? ` ${match.minute}′` : ''}`
                      : match.league?.name ?? pick(locale, 'موعد', 'Kickoff')}
                  </span>
                </div>
                <TeamMark name={match.awayTeam.name} logo={match.awayTeam.logoUrl} />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-xs text-muted-foreground">
          {pick(locale, 'لا مباريات حية أو لليوم في المصدر.', 'No live or today’s matches in the source.')}
        </p>
      )}
    </div>
  );
}

export function SameDeskRail({
  articles,
  category,
  locale,
}: {
  articles: Brief[];
  category: string;
  locale: string;
}) {
  if (articles.length === 0) return null;

  return (
    <div className="news-rail-panel">
      <div className="news-rail-head">
        <p className="news-rail-kicker">{pick(locale, 'نفس الباب', 'Same desk')}</p>
        <h2 className="news-rail-title">{deskLabel(category, locale)}</h2>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="block px-5 py-3.5 transition-colors hover:bg-orange-50/50 dark:hover:bg-card/[0.04]"
          >
            <strong className="block text-[13px] font-bold leading-6 text-foreground">{article.title}</strong>
            {article.publishedAt && (
              <ClientTime value={article.publishedAt} className="mt-1 block text-[10px] text-muted-foreground" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TeamMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <span className="flex w-[4.6rem] flex-col items-center gap-1">
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted dark:bg-card/[0.04]">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <span className="text-[9px] font-bold text-muted-foreground">{name.slice(0, 1)}</span>
        )}
      </span>
      <span className="w-full truncate text-center text-[9px] font-semibold text-foreground dark:text-muted-foreground">
        {name}
      </span>
    </span>
  );
}
