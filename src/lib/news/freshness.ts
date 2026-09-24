/** Stories older than this are archive, never "breaking / latest". */
export const NEWS_FRESH_HOURS = 48;

export function newsFreshSince(now = new Date()) {
  return new Date(now.getTime() - NEWS_FRESH_HOURS * 60 * 60 * 1000);
}

export function parseRssPublishedAt(item: { isoDate?: string; pubDate?: string }): Date | null {
  const raw = item.isoDate?.trim() || item.pubDate?.trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() > Date.now() + 2 * 60 * 60 * 1000) return null;
  return date;
}

const IMPORT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function shouldImportRssStory(publishedAt: Date, now = new Date()) {
  return now.getTime() - publishedAt.getTime() <= IMPORT_MAX_AGE_MS;
}
