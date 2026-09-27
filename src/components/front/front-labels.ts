export function specialStatusLabel(status: string, locale: string): string | null {
  const ar = locale !== 'en';
  if (status === 'POSTPONED') return ar ? 'تأجيل' : 'Postponed';
  if (status === 'CANCELLED') return ar ? 'إلغاء' : 'Cancelled';
  if (status === 'SUSPENDED' || status === 'INTERRUPTED' || status === 'ABANDONED') return ar ? 'إيقاف' : 'Suspended';
  return null;
}

export function kindLabel(kind: 'TEAM' | 'LEAGUE' | 'PLAYER', locale: string) {
  const ar = locale !== 'en';
  if (kind === 'TEAM') return ar ? 'فريق' : 'Team';
  if (kind === 'LEAGUE') return ar ? 'بطولة' : 'League';
  return ar ? 'لاعب' : 'Player';
}

export function daysWindowLabel(days: number, locale: string) {
  return locale === 'en' ? `Last ${days} days` : `آخر ${days} أيام`;
}
