import React from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronLeft } from 'lucide-react';
import { LeagueChapterNav } from '@/components/leagues/LeagueChapterNav';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';

type Chapter = 'hub' | 'standings' | 'scorers' | 'fixtures' | 'archive';

export function LeagueChapterShell({
  locale,
  slug,
  current,
  kicker,
  title,
  subtitle,
  leagueName,
  logoUrl,
  seasonId,
  seasons,
  seasonHref,
  signature,
  ghost,
  children,
}: {
  locale: string;
  slug: string;
  current: Chapter;
  kicker: string;
  title: string;
  subtitle?: string;
  leagueName: string;
  logoUrl: string | null;
  seasonId?: string | null;
  seasons?: string[];
  seasonHref?: (season: string) => string;
  signature?: Array<{ value: string | number; label: string }>;
  ghost?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="league-dossier league-chapter">
      <section className="league-hero">
        <div className="league-hero-grid" aria-hidden />
        <span className="league-hero-foil" aria-hidden />
        {ghost ? (
          <span className="league-hero-ghost" aria-hidden>
            {ghost}
          </span>
        ) : null}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="league-hero-wash" aria-hidden />
        ) : null}
        <div className="league-hero-vignette" aria-hidden />

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8 lg:px-12">
          <Link href={`/league/${slug}`} className="league-back-link mb-7 inline-flex items-center gap-1.5">
            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
            {pick(locale, 'العودة لملف البطولة', 'Back to league profile')}
          </Link>

          <div className="league-mast">
            <div className="league-crest-stage">
              <span className="league-crest-ring" aria-hidden />
              <div className="league-crest-plate !h-[5.5rem] !w-[5.5rem]">
                <LeagueCrest name={leagueName} logoUrl={logoUrl} className="h-14 w-14" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="league-kicker">{kicker}</span>
                {seasonId ? (
                  <span className="league-meta-chip">
                    {pick(locale, 'الموسم', 'Season')} {seasonId}
                  </span>
                ) : null}
              </div>
              <h1 className="league-wordmark !text-[clamp(1.8rem,4vw,2.8rem)]">{title}</h1>
              {subtitle ? <p className="mt-3 max-w-2xl text-sm font-medium text-white/50">{subtitle}</p> : null}

              {seasons && seasons.length > 1 && seasonHref ? (
                <div className="league-season-switch mt-5">
                  {seasons.slice(0, 8).map((season) => (
                    <Link
                      key={season}
                      href={seasonHref(season)}
                      className={season === seasonId ? 'is-active' : ''}
                    >
                      {season}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {signature && signature.length > 0 ? (
            <div className="league-signature mt-8">
              {signature.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`league-signature-tile${index === 0 ? ' is-lead' : ''}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-6 pt-8 sm:px-8 lg:px-12">
        <LeagueChapterNav slug={slug} current={current} />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}

export function ChapterSectionHead({
  folio,
  kicker,
  title,
  note,
}: {
  folio: string;
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="league-section-head mb-5">
      <div className="league-section-kicker-row">
        <span className="league-folio-mark" aria-hidden>
          {folio}
        </span>
        <span className="league-section-kicker">{kicker}</span>
      </div>
      <h2 className="league-section-title">{title}</h2>
      {note ? <p className="league-section-note">{note}</p> : null}
    </div>
  );
}
