import { isLiveStatus } from '@/lib/sports-data/match-window';
import { isFriendlyLeague } from '@/lib/sports-data/friendly';
import { leagueTier, matchdayWeight } from '@/lib/sports-data/matchday-weight';
import type { FrontMatch, FrontStory } from './types';

function leagueOf(match: FrontMatch) {
  return { name: match.league.name, slug: match.league.slug, country: match.league.country ?? '' };
}

export function pickCinemaMatch(matches: FrontMatch[]): FrontMatch | null {
  if (matches.length === 0) return null;
  const official = matches.filter((match) => !isFriendlyLeague(match.league));
  const pool = official.some((match) => isLiveStatus(match.status) || match.status === 'NOT_STARTED')
    ? official
    : matches;
  return [...pool].sort(
    (a, b) =>
      matchdayWeight({
        league: leagueOf(b),
        status: b.status,
        homeScore: b.homeScore,
        awayScore: b.awayScore,
      }) -
      matchdayWeight({
        league: leagueOf(a),
        status: a.status,
        homeScore: a.homeScore,
        awayScore: a.awayScore,
      }),
  )[0];
}

export function pickCinemaStory(lead: FrontStory | null, rest: FrontStory[]): FrontStory | null {
  if (lead?.image) return lead;
  return rest.find((story) => Boolean(story.image)) ?? lead;
}

export function cinemaPrefersMatch(matches: FrontMatch[]): boolean {
  const top = pickCinemaMatch(matches);
  if (!top) return false;
  if (isLiveStatus(top.status)) return true;
  return leagueTier(leagueOf(top)) >= 3;
}
