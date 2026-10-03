export function plainNewsText(htmlOrText?: string | null) {
  return (htmlOrText || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCountPlain(htmlOrText?: string | null) {
  const words = plainNewsText(htmlOrText).split(/\s+/).filter(Boolean);
  return words.length;
}

const MIN_WORDS = 160;
const LATIN_WPM = 220;
const ARABIC_CHARS_PER_MIN = 850;
const MIN_ARABIC_CHARS = 700;

export function readingTimeMinutes(htmlOrText?: string | null) {
  const plain = plainNewsText(htmlOrText);
  if (!plain) return 0;

  const words = plain.split(/\s+/).filter(Boolean).length;
  const arabicChars = (plain.match(/[\u0600-\u06FF]/g) || []).length;
  const letters = plain.replace(/\s+/g, '').length;
  const mostlyArabic = letters > 0 && arabicChars / letters >= 0.4;

  if (mostlyArabic) {
    if (arabicChars < MIN_ARABIC_CHARS && words < MIN_WORDS) return 0;
    return Math.max(1, Math.ceil(arabicChars / ARABIC_CHARS_PER_MIN));
  }

  if (words < MIN_WORDS) return 0;
  return Math.max(1, Math.ceil(words / LATIN_WPM));
}

export function readingTimeLabel(locale: string, minutes: number) {
  const mins = Math.max(1, Math.round(minutes));
  if (locale !== 'ar') return `${mins} min read`;
  if (mins === 1) return 'دقيقة قراءة';
  if (mins === 2) return 'دقيقتان قراءة';
  if (mins >= 3 && mins <= 10) return `${mins} دقائق قراءة`;
  return `${mins} دقيقة قراءة`;
}

/** List cards often only have a teaser. Trust a stored value only when it looks like a full read. */
export function listedReadingMinutes(story: {
  readingTime?: number | null;
  excerpt?: string | null;
  title?: string;
}) {
  const stored = Math.max(0, story.readingTime || 0);
  const fromCopy = readingTimeMinutes(`${story.title || ''} ${story.excerpt || ''}`);
  if (fromCopy > 0) return Math.max(stored, fromCopy);
  return stored >= 2 ? stored : 0;
}
