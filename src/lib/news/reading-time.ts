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

export function readingTimeMinutes(htmlOrText?: string | null) {
  return Math.max(1, Math.ceil(wordCountPlain(htmlOrText) / 200));
}
