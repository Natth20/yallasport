export function formatScore(home?: number | null, away?: number | null) {
  if (typeof home !== 'number' || typeof away !== 'number') return null;
  return `${home} — ${away}`;
}
