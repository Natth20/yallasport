export function currentFootballSeason(now = new Date()) {
  const year = now.getFullYear();
  return now.getMonth() >= 6 ? year : year - 1;
}

/** 1 July UTC of a football season year. */
export function footballSeasonStart(seasonYear: number) {
  return new Date(Date.UTC(seasonYear, 6, 1));
}

export function inFootballSeason(date: Date, seasonYear: number) {
  const start = footballSeasonStart(seasonYear);
  const end = footballSeasonStart(seasonYear + 1);
  return date >= start && date < end;
}

export function rotateList<T>(items: T[], tick: number) {
  if (items.length === 0) return items;
  const shift = ((tick % items.length) + items.length) % items.length;
  if (shift === 0) return items;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

export function deskTick(minutes = 20) {
  return Math.floor(Date.now() / (minutes * 60 * 1000));
}
