export function rankByPoints(higherCount: number) {
  return Math.max(1, higherCount + 1);
}

export function predictionAccuracy(correct: number, settled: number) {
  if (settled <= 0) return null;
  return Math.round((correct / settled) * 100);
}

export function settledStreak(rows: Array<{ isCorrect: boolean | null }>) {
  let streak = 0;
  for (const row of rows) {
    if (row.isCorrect !== true) break;
    streak += 1;
  }
  return streak;
}

export function scorerDeskSlug(name: string, externalId: string) {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'player';
  return `${base}-${externalId}`;
}
