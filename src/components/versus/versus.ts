export type VersusTeamOption = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
};

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
  return homeScore > awayScore ? 'home' as const : 'away' as const;
}

export function recordFor(
  matches: Array<{
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  }>,
  teamId: string
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
