export const POLL_KEYS = ['home', 'draw', 'away'] as const;
export type PollKey = (typeof POLL_KEYS)[number];

export type PollOption = {
  key: PollKey;
  votes: number;
};

export function parsePollOptions(raw: unknown): Record<PollKey, number> {
  const counts: Record<PollKey, number> = { home: 0, draw: 0, away: 0 };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return counts;
  const record = raw as Record<string, unknown>;
  for (const key of POLL_KEYS) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      counts[key] = Math.floor(value);
    }
  }
  if (counts.home + counts.draw + counts.away > 0) return counts;

  const entries = Object.entries(record);
  if (entries.length >= 3) {
    entries.slice(0, 3).forEach(([, value], index) => {
      const key = POLL_KEYS[index];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        counts[key] = Math.floor(value);
      }
    });
  }
  return counts;
}

export function isPollKey(value: unknown): value is PollKey {
  return value === 'home' || value === 'draw' || value === 'away';
}
