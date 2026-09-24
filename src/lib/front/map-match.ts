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
  league: { select: { id: true, name: true, slug: true, logoUrl: true, country: true } },
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
  league: { id: string; name: string; slug: string; logoUrl: string | null; country: string | null };
};

export function toFrontMatch(row: MatchRow): FrontMatch {
  return {
    id: row.id,
    status: row.status,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    minute: row.minute,
    kickoffAt: new Date(row.kickoffAt).toISOString(),
    homeTeam: row.homeTeam,
    awayTeam: row.awayTeam,
    league: row.league,
  };
}
