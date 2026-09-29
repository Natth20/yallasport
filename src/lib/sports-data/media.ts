function numericId(value?: string | null) {
  return value && /^\d+$/.test(value) ? value : null;
}

export function apiSportsPlayerPhoto(externalId?: string | null, existing?: string | null) {
  if (existing) return existing;
  const id = numericId(externalId);
  if (!id) return null;
  return `https://media.api-sports.io/football/players/${id}.png`;
}

export function apiSportsCoachPhoto(externalId?: string | null, existing?: string | null) {
  if (existing) return existing;
  const id = numericId(externalId);
  if (!id) return null;
  return `https://media.api-sports.io/football/coachs/${id}.png`;
}
