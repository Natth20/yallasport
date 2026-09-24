export function slugifyCoachName(name: string, id: string) {
  const base = name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  const tail = id.slice(-8).toLowerCase();
  return `${base || 'coach'}-${tail}`;
}
