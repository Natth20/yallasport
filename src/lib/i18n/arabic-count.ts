/** Arabic sports-desk counts (1 / 2 / 3–10 / 11+). */

type Noun = 'match' | 'goal' | 'league' | 'live' | 'liveMatch' | 'today' | 'table' | 'team' | 'country' | 'reel';

const FORMS: Record<Noun, { one: string; two: string; few: string; other: string }> = {
  match: { one: 'مباراة', two: 'مبارتان', few: 'مباريات', other: 'مباراة' },
  goal: { one: 'هدف', two: 'هدفان', few: 'أهداف', other: 'هدفًا' },
  league: { one: 'بطولة', two: 'بطولتان', few: 'بطولات', other: 'بطولة' },
  live: { one: 'مباشر', two: 'مباشر', few: 'مباشر', other: 'مباشر' },
  liveMatch: { one: 'مباراة مباشرة', two: 'مباراتان مباشرتان', few: 'مباريات مباشرة', other: 'مباراة مباشرة' },
  today: { one: 'مباراة اليوم', two: 'مباراتان اليوم', few: 'مباريات اليوم', other: 'مباراة اليوم' },
  table: { one: 'بطولة لديها جدول', two: 'بطولتان لديهما جدول', few: 'بطولات لديها جدول', other: 'بطولة لديها جدول' },
  team: { one: 'فريق', two: 'فريقان', few: 'فرق', other: 'فريقًا' },
  country: { one: 'دولة', two: 'دولتان', few: 'دول', other: 'دولة' },
  reel: { one: 'ريلز', two: 'ريلز', few: 'ريلز', other: 'ريلز' },
};

function bucket(n: number) {
  const abs = Math.abs(n);
  if (abs === 1) return 'one' as const;
  if (abs === 2) return 'two' as const;
  if (abs >= 3 && abs <= 10) return 'few' as const;
  return 'other' as const;
}

export function arabicNoun(n: number, noun: Noun) {
  return FORMS[noun][bucket(n)];
}

export function arabicCountLabel(n: number, noun: Noun) {
  if (noun === 'live') return n === 1 ? 'مباراة واحدة مباشرة' : `${n} ${arabicNoun(n, 'liveMatch')}`;
  if (n === 1 && noun === 'match') return 'مباراة واحدة';
  return `${n} ${arabicNoun(n, noun)}`;
}

export function countLabel(locale: string, n: number, noun: Noun, english: string) {
  if (locale === 'ar') return arabicNoun(n, noun);
  if (n === 1) return english.replace(/s$/, '');
  return english;
}
