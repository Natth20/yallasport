export function foldSearch(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ال(?=[\u0600-\u06ff])/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
}

export function slugBit(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const next = new Array<number>(b.length + 1);
  for (let i = 0; i < a.length; i++) {
    next[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      next[j + 1] = Math.min(next[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = next[j];
  }
  return prev[b.length];
}

export function titleKey(value: string) {
  return foldSearch(value).slice(0, 48);
}

export function scoreNameHit(name: string, query: string, extras: string[] = []) {
  const q = foldSearch(query);
  if (!q) return 0;
  const pool = [name, ...extras].map(foldSearch).filter(Boolean);
  let best = 0;
  for (const item of pool) {
    if (item === q) best = Math.max(best, 100);
    else if (item.startsWith(q) || q.startsWith(item)) best = Math.max(best, 82);
    else if (item.includes(q)) best = Math.max(best, 58);
    else if (q.length >= 4 && levenshtein(item, q) <= 1) best = Math.max(best, 44);
    else if (q.length >= 6 && levenshtein(item, q) <= 2) best = Math.max(best, 28);
  }
  return best;
}

export function newsRecencyBoost(publishedAt: Date | null | undefined, now = Date.now()) {
  if (!publishedAt) return 0;
  const age = now - publishedAt.getTime();
  if (age < 6 * 60 * 60 * 1000) return 40;
  if (age < 48 * 60 * 60 * 1000) return 24;
  if (age < 7 * 24 * 60 * 60 * 1000) return 12;
  if (age < 30 * 24 * 60 * 60 * 1000) return 4;
  return 0;
}

export function similarTitle(a: string, b: string) {
  const left = titleKey(a);
  const right = titleKey(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const longer = left.length >= right.length ? left : right;
  const shorter = left.length >= right.length ? right : left;
  if (longer.includes(shorter) && shorter.length >= 18) return true;
  return levenshtein(left, right) <= 2 && Math.min(left.length, right.length) >= 16;
}
