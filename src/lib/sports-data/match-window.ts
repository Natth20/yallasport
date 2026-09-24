/** Kickoff older than this cannot be treated as live on today/upcoming boards. */
export const STALE_LIVE_MS = 12 * 60 * 60 * 1000;
/** Finished matches older than this belong only in explicit archive/search. */
export const MATCH_ARCHIVE_AFTER_MS = 24 * 60 * 60 * 1000;

export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** UTC yesterday + today + tomorrow so the sports API covers every user timezone. */
export function cronFixtureDateKeys(now = new Date()) {
  return [
    utcDateKey(new Date(now.getTime() - 86_400_000)),
    utcDateKey(now),
    utcDateKey(new Date(now.getTime() + 86_400_000)),
  ];
}

export function liveKickoffFloor(now = new Date()) {
  return new Date(now.getTime() - STALE_LIVE_MS);
}

export function todayOrLiveWhere(start: Date, end: Date, now = new Date()) {
  return {
    OR: [
      { status: { in: ['LIVE' as const, 'HALFTIME' as const] }, kickoffAt: { gte: liveKickoffFloor(now) } },
      { kickoffAt: { gte: start, lt: end } },
    ],
  };
}

export function isLiveStatus(status: string) {
  return status === 'LIVE' || status === 'HALFTIME';
}

export function belongsOnTodayBoard(
  match: { status: string; kickoffAt: Date },
  start: Date,
  end: Date,
  now = new Date(),
) {
  const kickoff = new Date(match.kickoffAt).getTime();
  if (Number.isNaN(kickoff)) return false;
  if (isLiveStatus(match.status) && kickoff >= liveKickoffFloor(now).getTime()) return true;
  if (kickoff < start.getTime() || kickoff >= end.getTime()) return false;
  if (match.status === 'FINISHED' && now.getTime() - kickoff > MATCH_ARCHIVE_AFTER_MS) return false;
  return true;
}
