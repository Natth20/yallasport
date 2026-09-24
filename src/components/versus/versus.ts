export type VersusTeamOption = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
};

export const DERBY_NEEDLES = [
  { key: 'clasico', nameAr: 'الكلاسيكو', nameEn: 'El Clásico', tag: 'La Liga', a: 'Real Madrid', b: 'Barcelona' },
  { key: 'manc', nameAr: 'ديربي مانشستر', nameEn: 'Manchester Derby', tag: 'Premier League', a: 'Manchester City', b: 'Manchester United' },
  { key: 'riyadh', nameAr: 'ديربي الرياض', nameEn: 'Riyadh Derby', tag: 'SPL', a: 'Al Hilal', b: 'Al Nassr' },
  { key: 'italia', nameAr: 'ديربي إيطاليا', nameEn: 'Derby d’Italia', tag: 'Serie A', a: 'Inter', b: 'Juventus' },
  { key: 'nld', nameAr: 'ديربي شمال لندن', nameEn: 'North London Derby', tag: 'Premier League', a: 'Arsenal', b: 'Tottenham' },
] as const;

export function versusHref(a?: string, b?: string) {
  const params = new URLSearchParams();
  if (a) params.set('team1', a);
  if (b) params.set('team2', b);
  const search = params.toString();
  return search ? `/compare?${search}` : '/compare';
}

export function scoredWin(homeScore: number | null, awayScore: number | null) {
  if (homeScore == null || awayScore == null) return null;
  if (homeScore === awayScore) return 'draw' as const;
  return homeScore > awayScore ? ('home' as const) : ('away' as const);
}

export function remapMatchSides<T extends { homeTeamId: string; awayTeamId: string }>(
  row: T,
  idMap: Map<string, string>,
) {
  return {
    ...row,
    homeTeamId: idMap.get(row.homeTeamId) ?? row.homeTeamId,
    awayTeamId: idMap.get(row.awayTeamId) ?? row.awayTeamId,
  };
}

export function shareBar(a: number, b: number) {
  if (a === 0 && b === 0) return { pct: 50, empty: true as const };
  return { pct: Math.round((a / (a + b)) * 100), empty: false as const };
}

export function recordFor(
  matches: Array<{
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  }>,
  teamId: string,
) {
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let skipped = 0;
  for (const row of matches) {
    const result = scoredWin(row.homeScore, row.awayScore);
    if (!result) {
      skipped += 1;
      continue;
    }
    if (result === 'draw') {
      drawn += 1;
      continue;
    }
    const home = row.homeTeamId === teamId;
    const wonThis = (home && result === 'home') || (!home && result === 'away');
    if (wonThis) won += 1;
    else lost += 1;
  }
  return { won, drawn, lost, skipped, played: won + drawn + lost };
}
