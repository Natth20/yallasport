export type WeightedLeague = {
  name: string;
  slug?: string;
  country?: string;
};

const YOUTH_OR_REGIONAL =
  /\bu1[89]\b|\bu2[0-3]\b|youth|reserves|girone|paulista|federal a|liga revela|premier league cup|copa santa|torneo federal/i;

export function leagueTier(league: WeightedLeague): number {
  const country = String(league.country || '').toLowerCase();
  const name = String(league.name ?? '').toLowerCase();
  const slug = String(league.slug || '').toLowerCase();
  const blob = `${name} ${slug} ${country}`;

  if (YOUTH_OR_REGIONAL.test(blob)) return 0;

  if (/uefa champions|fifa club world|world cup|euro 20|copa america|afc champions|caf champions/.test(blob)) {
    return 6;
  }

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
