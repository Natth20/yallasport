import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { localizeCompetitionTitle, localizeCountryName } from '@/lib/i18n/competition-names';
import type { FrontMatch } from './types';

export const frontMatchSelect = {
  id: true,
  status: true,
  homeScore: true,
  awayScore: true,
  minute: true,
  kickoffAt: true,
  homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
  awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
  league: { select: { id: true, name: true, slug: true, logoUrl: true, country: true, externalId: true } },
} as const;

type MatchRow = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  kickoffAt: Date;
  homeTeam: { id: string; name: string; slug: string; logoUrl: string | null };
  awayTeam: { id: string; name: string; slug: string; logoUrl: string | null };
  league: { id: string; name: string; slug: string; logoUrl: string | null; country: string | null; externalId?: string | null };
};

export function toFrontMatch(row: MatchRow, locale: string): FrontMatch {
  return {
    id: row.id,
    status: row.status,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    minute: row.minute,
    kickoffAt: new Date(row.kickoffAt).toISOString(),
    homeTeam: { ...row.homeTeam, name: localizeTeamName(locale, row.homeTeam.name) },
    awayTeam: { ...row.awayTeam, name: localizeTeamName(locale, row.awayTeam.name) },
    league: {
      ...row.league,
      name: localizeCompetitionTitle(locale, row.league),
      country: row.league.country ? localizeCountryName(locale, row.league.country) : row.league.country,
    },
  };
}
