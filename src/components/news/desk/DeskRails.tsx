import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { PitchWatermark } from '@/components/decor/CraftMarks';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { Brief, PitchMatch, SourceTally, TeamInNews } from '@/lib/news/load-desk';
import { Radio, Flame, Sparkles } from 'lucide-react';

export function MostReadRail({ articles, locale }: { articles: Brief[]; locale: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:border-border/90">
      <div className="border-b border-border/70 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            <Flame className="h-3 w-3" />
            {pick(locale, 'التداول', 'Circulation')}
          </p>
          <h2 className="mt-0.5 text-base font-black text-foreground">{pick(locale, 'الأكثر قراءة', 'Most read')}</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold text-primary">
          TOP {articles.length || 5}
        </span>
      </div>
      {articles.length > 0 ? (
        <ol className="divide-y divide-border/40">
          {articles.map((article, index) => (
            <li key={article.id}>
              <Link
                href={`/news/${article.slug}`}
                className="group flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-primary/5"
              >
                <span className="w-6 shrink-0 text-base font-black tabular-nums text-primary/70 transition-colors group-hover:text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-[13px] font-bold leading-5 text-foreground transition-colors group-hover:text-primary">
                    {article.title}
                  </strong>
                  <span className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                    <span className="text-primary font-bold">{deskLabel(article.category, locale)}</span>
                    {article.views > 0 && <span>· {article.views} {pick(locale, 'مشاهدة', 'views')}</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="px-5 py-6">
          {['01', '02', '03', '04', '05'].map((folio) => (
            <div key={folio} className="flex items-center gap-3 py-2">
              <span className="w-6 text-xs font-bold text-muted-foreground/60">{folio}</span>
              <span className="h-px flex-1 bg-border/60" />
            </div>
          ))}
          <p className="pt-3 text-[11px] text-muted-foreground text-center">
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
          {pick(locale, 'السجل', 'The ledger')}
        </p>
        <h2 className="mt-0.5 text-base font-black text-foreground">
          {pick(locale, 'من أين تأتي الأخبار', 'Where the news comes from')}
        </h2>
      </div>
      <ul className="divide-y divide-border/40">
        {sources.map((source) => {
          const isSelected = selected === source.name;
          return (
            <li key={source.name}>
              <Link
                href={hrefFor({ source: isSelected ? 'all' : source.name, page: 1 })}
                className={`group flex items-center justify-between gap-3 px-5 py-3 transition-colors ${
                  isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-bold text-foreground group-hover:text-primary">
                      {source.name}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {source.locales.map((code) => (code === 'ar' ? 'عربي' : 'EN')).join(' · ')}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-500"
                      style={{ width: `${(source.count / peak) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs font-black tabular-nums text-muted-foreground group-hover:text-primary">
                  {source.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Teams the stories actually mention, via confirmed NewsEntityLink rows. */
export function TeamsInNewsRail({ teams, locale }: { teams: TeamInNews[]; locale: string }) {
  if (teams.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm">
      <div className="border-b border-border/70 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3 w-3" />
            {pick(locale, 'الأسماء', 'The names')}
          </p>
          <h2 className="mt-0.5 text-base font-black text-foreground">
            {pick(locale, 'فرق في الأخبار', 'Teams in the news')}
          </h2>
        </div>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/team/${team.slug}`}
            className="group flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-bold transition-all hover:border-primary hover:bg-primary/5"
          >
            {team.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={team.logoUrl} alt="" className="h-4 w-4 object-contain" />
            ) : null}
            <span className="truncate max-w-[120px] text-foreground group-hover:text-primary">{team.name}</span>
            <b className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-black text-primary">
              {team.count}
            </b>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PitchPanel({ matches, locale }: { matches: PitchMatch[]; locale: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm">
      <PitchWatermark className="pointer-events-none absolute -end-6 top-10 h-28 w-44 text-primary/[0.06]" />
      <div className="relative flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            {pick(locale, 'الملعب', 'The pitch')}
          </p>
          <h2 className="mt-0.5 text-base font-black text-foreground">
            {pick(locale, 'اليوم من المصدر', 'Today from the source')}
          </h2>
        </div>
        <Link href="/matches" className="text-[10px] font-bold text-primary hover:underline">
          {pick(locale, 'الجدول', 'Fixtures')}
        </Link>
      </div>
      {matches.length > 0 ? (
        <div className="divide-y divide-border/40">
          {matches.slice(0, 8).map((match) => {
            const live = match.status === 'LIVE' || match.status === 'HALFTIME';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-primary/5"
              >
                <TeamMark name={match.homeTeam.name} logo={match.homeTeam.logoUrl} />
                <div className="min-w-0 flex-1 text-center">
                  {live ? (
                    <span className="block text-[13px] font-black tabular-nums text-foreground">
                      {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                        ? `${match.homeScore}–${match.awayScore}`
                        : '—'}
                    </span>
                  ) : (
                    <ClientTime
                      value={match.kickoffAt}
                      className="block text-[12px] font-bold tabular-nums text-primary"
                    />
                  )}
                  <span className="mt-0.5 flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                    {live && <Radio className="h-2.5 w-2.5 text-red-500 animate-pulse" />}
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
        <p className="px-5 py-8 text-center text-xs text-muted-foreground">
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
          {pick(locale, 'نفس الباب', 'Same desk')}
        </p>
        <h2 className="mt-0.5 text-base font-black text-foreground">{deskLabel(category, locale)}</h2>
      </div>
      <div className="divide-y divide-border/40">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group block px-5 py-3.5 transition-colors hover:bg-primary/5"
          >
            <strong className="block text-[13px] font-bold leading-5 text-foreground transition-colors group-hover:text-primary">
              {article.title}
            </strong>
            {article.publishedAt && (
              <ClientTime value={article.publishedAt} className="mt-1 block text-[10px] font-semibold text-muted-foreground" />
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
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <span className="text-[9px] font-bold text-muted-foreground">{name.slice(0, 1)}</span>
        )}
      </span>
      <span className="w-full truncate text-center text-[9px] font-semibold text-foreground">
        {name}
      </span>
    </span>
  );
}
