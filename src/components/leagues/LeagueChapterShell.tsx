import React from 'react';
import { Link } from '@/i18n/navigation';
import { BarChart3, CalendarDays, History, ListOrdered, Target, Trophy } from 'lucide-react';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage, type SalonTone } from '@/components/salon/SalonStage';
import { pick } from '@/i18n/pick';
import { formatLeagueSeason } from '@/lib/i18n/competition-names';
import styles from './league-house.module.css';

type Chapter = 'hub' | 'standings' | 'scorers' | 'fixtures' | 'archive';

const CHAPTER_TONE: Record<Exclude<Chapter, 'hub'>, SalonTone> = {
  fixtures: 'agenda',
  standings: 'rung',
  scorers: 'blaze',
  archive: 'folio',
};

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
  statsLeagueId,
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
  statsLeagueId?: string | null;
  signature?: Array<{ value: string | number; label: string }>;
  ghost?: string;
  children: React.ReactNode;
}) {
  const tone = current === 'hub' ? 'sash' : CHAPTER_TONE[current];
  void logoUrl;
  void ghost;

  return (
    <SalonStage
      tone={tone}
      wide
      compact
      kicker={kicker}
      title={title}
      lead={subtitle || leagueName}
      aside={formatLeagueSeason(seasonId) || seasonId || undefined}
      tools={
        <HallFoyer
          label={pick(locale, 'فصول البطولة', 'Competition chapters')}
          items={[
            { href: `/league/${slug}`, label: pick(locale, 'نظرة عامة', 'Overview'), icon: CalendarDays, current: current === 'hub' },
            { href: `/league/${slug}/fixtures`, label: pick(locale, 'المباريات', 'Matches'), icon: ListOrdered, current: current === 'fixtures' },
            { href: `/league/${slug}/standings`, label: pick(locale, 'الترتيب', 'Table'), icon: Trophy, current: current === 'standings' },
            { href: `/league/${slug}/top-scorers`, label: pick(locale, 'الهدافون', 'Scorers'), icon: Target, current: current === 'scorers' },
            {
              href: statsLeagueId ? `/stats/${encodeURIComponent(statsLeagueId)}` : '/stats',
              label: pick(locale, 'الإحصائيات', 'Stats'),
              icon: BarChart3,
            },
            { href: `/league/${slug}/archive`, label: pick(locale, 'الأرشيف', 'Archive'), icon: History, current: current === 'archive' },
          ]}
        />
      }
    >
      <div className={`${styles.folio} league-dossier league-chapter`}>
        {seasons && seasons.length > 1 && seasonHref ? (
          <div className="league-season-switch">
            {seasons.slice(0, 8).map((season) => (
              <Link key={season} href={seasonHref(season)} className={season === seasonId ? 'is-active' : ''}>
                {formatLeagueSeason(season) || season}
              </Link>
            ))}
          </div>
        ) : null}

        {signature && signature.length > 0 ? (
          <div className="league-signature">
            {signature.map((stat, index) => (
              <div
                key={stat.label}
                className={`league-signature-tile${index === 0 ? ' is-lead' : ''}`}
              >
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </SalonStage>
  );
}

export function ChapterSectionHead({
  folio,
  kicker,
  title,
  note,
}: {
  folio?: string;
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="league-section-head mb-5">
      <div className="league-section-kicker-row">
        {folio ? (
          <span className="league-folio-mark" aria-hidden>
            {folio}
          </span>
        ) : null}
        <span className="league-section-kicker">{kicker}</span>
      </div>
      <h2 className="league-section-title">{title}</h2>
      {note ? <p className="league-section-note">{note}</p> : null}
    </div>
  );
}
