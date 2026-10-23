'use client';

import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { PitchWatermark } from '@/components/decor/CraftMarks';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { Brief, PitchMatch, SourceTally, TeamInNews } from '@/lib/news/load-desk';
import { FrontWhen } from '@/components/front/FrontWhen';
import { Radio, Flame, Sparkles, Eye, ArrowLeft, ArrowRight, Crown } from 'lucide-react';

export function MostReadRail({
  articles,
  locale,
  title,
  todayArticles,
  weekArticles,
  monthArticles,
}: {
  articles?: Brief[];
  locale: string;
  title?: string;
  todayArticles?: Brief[];
  weekArticles?: Brief[];
  monthArticles?: Brief[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'today' | 'week' | 'month'>('today');

  const activeArticles =
    tab === 'today'
      ? (todayArticles && todayArticles.length > 0 ? todayArticles : (weekArticles || articles || []))
      : tab === 'week'
      ? (weekArticles && weekArticles.length > 0 ? weekArticles : (todayArticles || articles || []))
      : (monthArticles && monthArticles.length > 0 ? monthArticles : (weekArticles || articles || []));

  const list = activeArticles.slice(0, 6);

  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/65 to-card/45 backdrop-blur-xl shadow-xl transition-all">
      <div className="border-b border-border/70 p-5 space-y-4 bg-muted/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-amber-500">
              <Flame className="h-3.5 w-3.5 animate-pulse" />
              {pick(locale, 'التداول الصحفي', 'Circulation')}
            </p>
            <h2 className="mt-1 text-base font-black text-foreground">
              {title || pick(locale, 'الأكثر قراءة وتأثيراً', 'Most read & impactful')}
            </h2>
          </div>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-[10px] font-black text-amber-500 shadow-2xs">
            TOP 6
          </span>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-muted/40 p-1.5 border border-border/50 text-xs font-bold backdrop-blur-md">
          <button
            type="button"
            onClick={() => setTab('today')}
            className={`flex-1 rounded-xl py-2 px-3 text-center transition-all duration-200 ${
              tab === 'today'
                ? 'bg-primary text-primary-foreground font-black shadow-md shadow-primary/25 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {pick(locale, 'اليوم', 'Today')}
          </button>
          <button
            type="button"
            onClick={() => setTab('week')}
            className={`flex-1 rounded-xl py-2 px-3 text-center transition-all duration-200 ${
              tab === 'week'
                ? 'bg-primary text-primary-foreground font-black shadow-md shadow-primary/25 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {pick(locale, 'هذا الأسبوع', 'This week')}
          </button>
          <button
            type="button"
            onClick={() => setTab('month')}
            className={`flex-1 rounded-xl py-2 px-3 text-center transition-all duration-200 ${
              tab === 'month'
                ? 'bg-primary text-primary-foreground font-black shadow-md shadow-primary/25 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {pick(locale, 'هذا الشهر', 'This month')}
          </button>
        </div>
      </div>

      {list.length > 0 ? (
        <ol className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {list.map((article, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            const podiumBadge = isFirst ? (
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 ring-1 ring-amber-300">
                01
              </span>
            ) : isSecond ? (
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-900 font-black text-xs shadow-sm ring-1 ring-slate-300">
                02
              </span>
            ) : isThird ? (
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 font-black text-xs shadow-sm ring-1 ring-amber-700">
                03
              </span>
            ) : (
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground font-black text-xs border border-border/50">
                {String(index + 1).padStart(2, '0')}
              </span>
            );

            return (
              <li key={article.id}>
                <Link
                  href={`/news/${article.slug}`}
                  className={`group flex items-start gap-3.5 p-3.5 rounded-2xl transition-all duration-200 ${
                    isFirst
                      ? 'border border-amber-500/30 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] hover:border-amber-500/50 hover:shadow-md'
                      : 'border border-border/40 bg-card/40 hover:bg-primary/5 hover:border-primary/40 hover:shadow-xs'
                  }`}
                >
                  {podiumBadge}

                  <span className="min-w-0 flex-1">
                    <strong className={`block font-bold leading-snug transition-colors group-hover:text-primary ${
                      isFirst ? 'text-sm text-foreground' : 'text-xs text-foreground/90'
                    }`}>
                      <bdi dir="auto">{article.title}</bdi>
                    </strong>

                    <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/news?desk=${encodeURIComponent(article.category || 'all')}`);
                        }}
                        title={pick(locale, `فتح قسم ${deskLabel(article.category, locale)} بالكامل`, `Open full section for ${deskLabel(article.category, locale)}`)}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-primary font-black hover:bg-primary/20 transition-colors"
                      >
                        {deskLabel(article.category, locale)}
                      </button>

                      {article.publishedAt ? (
                        <span className="inline-flex items-center text-muted-foreground">
                          <FrontWhen value={article.publishedAt} />
                        </span>
                      ) : null}

                      {article.views > 0 && (
                        <span className="inline-flex items-center gap-1 font-black text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          <Eye className="h-2.5 w-2.5 text-primary" />
                          <span>{article.views} {pick(locale, 'مشاهدة', 'views')}</span>
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="px-5 py-8 text-center text-xs text-muted-foreground">
          {pick(locale, 'بانتظار التداول — لا تقارير معتمدة بعد.', 'Awaiting circulation — no approved reports yet.')}
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
                className={`group flex items-center justify-between gap-3 px-5 py-3 transition-colors ${isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'
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
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-md shadow-sm">
      <div className="border-b border-border/70 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3 w-3" />
            {pick(locale, 'الأكثر ذكراً', 'Most mentioned')}
          </p>
          <h2 className="mt-0.5 text-base font-black text-foreground">
            {pick(locale, 'فرق في الأخبار', 'Teams in the news')}
          </h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary">
          {teams.length} {pick(locale, 'فريق', 'clubs')}
        </span>
      </div>
      <div className="p-3.5 grid grid-cols-2 gap-2.5">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/team/${team.slug}`}
            className="group flex items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-background/60 p-2.5 transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card border border-border/60 p-1 group-hover:border-primary/30 transition-colors">
                {team.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logoUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">{team.name.slice(0, 1)}</span>
                )}
              </div>
              <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                <bdi dir="auto">{team.name}</bdi>
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-black text-primary tabular-nums">
              {team.count}
            </span>
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
      <div className="border-b border-border/70 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            {pick(locale, 'نفس الباب', 'Same desk')}
          </p>
          <h2 className="mt-0.5 text-base font-black text-foreground">{deskLabel(category, locale)}</h2>
        </div>
        <Link
          href={`/news?desk=${encodeURIComponent(category || 'all')}`}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          title={pick(locale, `فتح قسم ${deskLabel(category, locale)} بالكامل`, `Open full section for ${deskLabel(category, locale)}`)}
        >
          <span>{pick(locale, 'فتح القسم بالكامل', 'View full section')}</span>
          {locale === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </Link>
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
