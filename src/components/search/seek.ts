export const SEEK_KINDS = ['all', 'news', 'teams', 'players', 'leagues', 'matches'] as const;
export type SeekKind = (typeof SEEK_KINDS)[number];

export function parseSeekKind(value?: string | null): SeekKind {
  const kind = (value || '').toLowerCase();
  return (SEEK_KINDS as readonly string[]).includes(kind) ? (kind as SeekKind) : 'all';
}

export function clampSeekQuery(value?: string | null) {
  return (value || '').trim().slice(0, 80);
}

export function seekHref(query: string, kind: SeekKind = 'all') {
  const params = new URLSearchParams();
  const q = clampSeekQuery(query);
  if (q) params.set('q', q);
  if (kind !== 'all') params.set('kind', kind);
  const search = params.toString();
  return search ? `/search?${search}` : '/search';
}

export function canShowScore(status: string, homeScore: number | null, awayScore: number | null) {
  if (homeScore == null || awayScore == null) return false;
  return status === 'LIVE' || status === 'HALFTIME' || status === 'FINISHED';
}
