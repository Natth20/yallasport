import { sourceSearchQuery } from '@/lib/i18n/sports-lexicon';
import { foldSearch, levenshtein } from './text';

/** Confirmed desk aliases only — short tokens that collide are omitted. */
const ALIAS_CANONICAL: Record<string, string> = {
  [foldSearch('ريال مدريد')]: 'Real Madrid',
  [foldSearch('ريال مدريد سي اف')]: 'Real Madrid',
  [foldSearch('الريال')]: 'Real Madrid',
  [foldSearch('الملكي')]: 'Real Madrid',
  [foldSearch('real madrid')]: 'Real Madrid',
  [foldSearch('real madrid cf')]: 'Real Madrid',
  [foldSearch('برشلونة')]: 'Barcelona',
  [foldSearch('البارسا')]: 'Barcelona',
  [foldSearch('برسا')]: 'Barcelona',
  [foldSearch('مانشستر يونايتد')]: 'Manchester United',
  [foldSearch('الشياطين الحمر')]: 'Manchester United',
  [foldSearch('مانشستر سيتي')]: 'Manchester City',
  [foldSearch('السيتي')]: 'Manchester City',
  [foldSearch('ليفربول')]: 'Liverpool',
  [foldSearch('الريدز')]: 'Liverpool',
  [foldSearch('باريس سان جيرمان')]: 'Paris Saint-Germain',
  [foldSearch('باريس')]: 'Paris Saint-Germain',
  [foldSearch('بايرن')]: 'Bayern Munich',
  [foldSearch('بايرن ميونخ')]: 'Bayern Munich',
  [foldSearch('مبابي')]: 'Kylian Mbappe',
  [foldSearch('كيليان مبابي')]: 'Kylian Mbappe',
  [foldSearch('kylian mbappe')]: 'Kylian Mbappe',
  [foldSearch('kylian mbappé')]: 'Kylian Mbappe',
  [foldSearch('mbappe')]: 'Kylian Mbappe',
  [foldSearch('mbappé')]: 'Kylian Mbappe',
};

const HINTS = [
  'ريال مدريد',
  'ريال بيتيس',
  'ريال سوسيداد',
  'برشلونة',
  'مانشستر يونايتد',
  'مانشستر سيتي',
  'ليفربول',
  'باريس سان جيرمان',
  'بايرن ميونخ',
  'Real Madrid',
  'Barcelona',
  'كيليان مبابي',
  'مبابي',
  'Kylian Mbappe',
];

export function expandQueryVariants(raw: string): string[] {
  const query = raw.trim().slice(0, 80);
  if (!query) return [];
  const out = new Set<string>();
  const push = (value: string) => {
    const next = value.trim();
    if (next.length >= 2) out.add(next);
  };
  push(query);
  const latin = sourceSearchQuery(query);
  push(latin);
  const alias = ALIAS_CANONICAL[foldSearch(query)];
  if (alias) {
    push(alias);
    push(sourceSearchQuery(alias));
  }
  return [...out];
}

export function didYouMean(query: string): string | null {
  const q = foldSearch(query);
  if (q.length < 4) return null;
  let best: { name: string; dist: number } | null = null;
  for (const name of HINTS) {
    const dist = levenshtein(q, foldSearch(name));
    if (dist === 0) return null;
    if (dist <= 2 && (!best || dist < best.dist)) best = { name, dist };
  }
  return best?.name ?? null;
}
