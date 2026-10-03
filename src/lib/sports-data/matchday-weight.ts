import { isFriendlyLeague } from '@/lib/sports-data/friendly';

export type WeightedLeague = {
  name: string;
  slug?: string;
  country?: string;
  externalId?: string;
};

const YOUTH_OR_REGIONAL =
  /\bu1[89]\b|\bu2[0-3]\b|youth|reserves|girone|paulista|federal a|liga revela|premier league cup|copa santa|torneo federal/i;

const TOP_FLIGHT_IDS = new Set(['2', '3', '39', '61', '78', '135', '140', '307', '233', '848']);

export function leagueTier(league: WeightedLeague): number {
  const country = String(league.country || '').toLowerCase();
  const name = String(league.name ?? '').toLowerCase();
  const slug = String(league.slug || '').toLowerCase();
  const id = String(league.externalId || '');
  const blob = `${name} ${slug} ${country}`;

  if (isFriendlyLeague(league) || YOUTH_OR_REGIONAL.test(blob)) return 0;

  if (id === '2' || id === '1' || /uefa champions|fifa club world|world cup|euro 20|copa america|afc champions|caf champions/.test(blob)) {
    return 6;
  }

  if (TOP_FLIGHT_IDS.has(id) && id !== '2' && id !== '3' && id !== '848') return 5;

  if (/الليغا|الدوري الإسباني/.test(league.name) || ((country === 'spain' || country === '') && /^(la liga|laliga)$/.test(name))) {
    return 5;
  }

  const topDomestic =
    (country === 'england' && name === 'premier league') ||
    (country === 'spain' && (/la liga|laliga|primera|الليغا|الدوري الإسباني/.test(name))) ||
    (country === 'italy' && name === 'serie a') ||
    (country === 'germany' && /bundesliga/.test(name) && !/2\.|ii|3\./.test(name)) ||
    (country === 'france' && name === 'ligue 1') ||
    ((country === 'saudi-arabia' || country === 'saudi arabia') && /pro league|saudi/.test(name)) ||
    (country === 'egypt' && /premier|الدوري/.test(name));
  if (topDomestic) return 5;

  if (/europa league|conference league|copa libertadores/.test(blob)) return 4;

  const watchedCountries = new Set([
    'spain', 'england', 'italy', 'germany', 'france', 'portugal', 'netherlands',
    'turkey', 'saudi arabia', 'saudi-arabia', 'egypt', 'qatar', 'united arab emirates',
    'morocco', 'algeria', 'tunisia', 'jordan', 'iraq', 'bahrain', 'kuwait',
  ]);
  if (watchedCountries.has(country) && !/cup$|coppa|coupe|trophy|super cup/.test(name)) return 3;

  return 1;
}

export const MAJOR_LEAGUE_TIER = 3;

export function isMajorLeague(league: WeightedLeague): boolean {
  return leagueTier(league) >= MAJOR_LEAGUE_TIER;
}

function isLiveMatchStatus(status: string) {
  return status === 'LIVE' || status === 'HALFTIME';
}

export function compareMatchdayGroups<T extends { league: WeightedLeague; matches: Array<{ status: string; kickoffAt: Date | string }> }>(
  first: T,
  second: T,
) {
  const liveOf = (group: T) => group.matches.filter((match) => isLiveMatchStatus(match.status)).length;
  const liveDiff = liveOf(second) - liveOf(first);
  if (liveDiff) return liveDiff;

  const upcomingOf = (group: T) => group.matches.filter((match) => match.status === 'NOT_STARTED');
  const upcomingDiff = Number(upcomingOf(second).length > 0) - Number(upcomingOf(first).length > 0);
  if (upcomingDiff) return upcomingDiff;

  const nextKick = (group: T) => {
    const liveOrUp = group.matches.filter(
      (match) => isLiveMatchStatus(match.status) || match.status === 'NOT_STARTED',
    );
    const pool = liveOrUp.length ? liveOrUp : group.matches;
    return Math.min(...pool.map((match) => new Date(match.kickoffAt).getTime()));
  };
  const kickDiff = nextKick(first) - nextKick(second);
  if (kickDiff) return kickDiff;

  const tierDiff = leagueTier(second.league) - leagueTier(first.league);
  if (tierDiff) return tierDiff;

  return String(first.league.name).localeCompare(String(second.league.name), 'ar');
}

export function matchdayWeight(input: {
  league: WeightedLeague;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  hasLicensedStream?: boolean;
  eventCount?: number;
}): number {
  const live = input.status === 'LIVE' || input.status === 'HALFTIME';
  const goals =
    typeof input.homeScore === 'number' && typeof input.awayScore === 'number'
      ? input.homeScore + input.awayScore
      : 0;
  return (
    leagueTier(input.league) * 1800 +
    (live ? 900 : input.status === 'NOT_STARTED' ? 120 : 40) +
    goals * 40 +
    (input.eventCount ?? 0) * 2 +
    (input.hasLicensedStream ? 80 : 0)
  );
}
