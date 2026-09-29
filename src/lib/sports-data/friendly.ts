export function isFriendlyLeague(league: { name?: string | null; slug?: string | null; country?: string | null }) {
  const blob = `${league.name || ''} ${league.slug || ''} ${league.country || ''}`.toLowerCase();
  return /friend|ودية|exhibition|club friendly|international friendly/.test(blob);
}
