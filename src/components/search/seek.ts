export const SEEK_KINDS = [
  'all',
  'matches',
  'teams',
  'players',
  'coaches',
  'leagues',
  'news',
  'transfers',
  'videos',
  'photos',
] as const;
export type SeekKind = (typeof SEEK_KINDS)[number];

export function parseSeekKind(value?: string | null): SeekKind {
  const kind = (value || '').toLowerCase();
  return (SEEK_KINDS as readonly string[]).includes(kind) ? (kind as SeekKind) : 'all';
}

export function clampSeekQuery(value?: string | null) {
  return (value || '').trim().slice(0, 80);
}

export function seekHref(query: string, kind: SeekKind = 'all', page?: number) {
  const params = new URLSearchParams();
  const q = clampSeekQuery(query);
  if (q) params.set('q', q);
  if (kind !== 'all') params.set('kind', kind);
  if (page && page > 1) params.set('page', String(page));
  const search = params.toString();
  return search ? `/search?${search}` : '/search';
}

export function canShowScore(status: string, homeScore: number | null, awayScore: number | null) {
  if (homeScore == null || awayScore == null) return false;
  return status === 'LIVE' || status === 'HALFTIME' || status === 'FINISHED';
}

export function matchStatusLabel(status: string, locale: string) {
  const ar = locale === 'ar';
  if (status === 'LIVE' || status === 'HALFTIME') return ar ? 'مباشر' : 'LIVE';
  if (status === 'FINISHED') return ar ? 'انتهت' : 'FT';
  if (status === 'POSTPONED') return ar ? 'مؤجلة' : 'Postponed';
  if (status === 'CANCELLED') return ar ? 'ملغاة' : 'Cancelled';
  return ar ? 'لم تبدأ' : 'NS';
}
