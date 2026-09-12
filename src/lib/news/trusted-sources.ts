/**
 * Trusted football / sports news hosts only.
 * Public pages and RSS import must resolve to one of these domains.
 */
export const TRUSTED_NEWS_HOSTS = [
  'bbc.com',
  'bbc.co.uk',
  'aljazeera.net',
  'aljazeera.com',
  'goal.com',
  'skysports.com',
  'theguardian.com',
  'reuters.com',
  'espn.com',
  'espnfc.com',
  'beinsports.com',
  'france24.com',
  'dw.com',
  'arabnews.com',
  'skynewsarabia.com',
  'yallakora.com',
  'filgoal.com',
  'sport360.com',
  'marca.com',
  'as.com',
  'lequipe.fr',
  'gazzetta.it',
  'kicker.de',
] as const;

/** Public RSS endpoints we allow for import. */
export const TRUSTED_RSS_FEEDS = [
  {
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    name: 'BBC Sport Football',
    host: 'bbc.co.uk',
  },
  {
    url: 'https://www.bbc.com/sport/football/rss.xml',
    name: 'BBC Sport Football',
    host: 'bbc.com',
  },
  {
    url: 'https://www.aljazeera.net/xml/rss/all.xml',
    name: 'Al Jazeera',
    host: 'aljazeera.net',
  },
  {
    url: 'https://www.goal.com/feeds/en/news',
    name: 'Goal',
    host: 'goal.com',
  },
  {
    url: 'https://www.skysports.com/rss/12040',
    name: 'Sky Sports Football',
    host: 'skysports.com',
  },
  {
    url: 'https://www.theguardian.com/football/rss',
    name: 'The Guardian Football',
    host: 'theguardian.com',
  },
] as const;

const NON_NEWS_PATTERN =
  /who\s*am\s*i|من\s*أنا|quiz|puzzle|crossword|wordle|guess\s+the|خمّن|اختبر\s*معرفتك|مسابقة|poll\b|trivia|fantasy\s*draft|live\s*blog\s*quiz/i;

export function hostFromUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, '');
    return host || null;
  } catch {
    return null;
  }
}

export function isTrustedNewsHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().replace(/^www\./, '');
  return TRUSTED_NEWS_HOSTS.some(
    (trusted) => normalized === trusted || normalized.endsWith(`.${trusted}`)
  );
}

export function isTrustedNewsUrl(raw: string | null | undefined): boolean {
  return isTrustedNewsHost(hostFromUrl(raw));
}

export function isTrustedRssFeedUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const incoming = new URL(raw);
    return TRUSTED_RSS_FEEDS.some((feed) => {
      try {
        const allowed = new URL(feed.url);
        return (
          incoming.hostname.replace(/^www\./, '') === allowed.hostname.replace(/^www\./, '') &&
          incoming.pathname.replace(/\/$/, '') === allowed.pathname.replace(/\/$/, '')
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/** Drop quizzes, games, and other non-report items even if the host is trusted. */
export function isEditorialNewsItem(title: string, content = ''): boolean {
  const text = `${title} ${content}`.trim();
  if (!text) return false;
  if (NON_NEWS_PATTERN.test(text)) return false;
  return true;
}

export function displaySourceName(sourceName: string | null | undefined, sourceUrl: string | null | undefined) {
  if (sourceName?.trim()) return sourceName.trim();
  const host = hostFromUrl(sourceUrl);
  if (!host) return null;
  const known = TRUSTED_RSS_FEEDS.find((feed) => host === feed.host || host.endsWith(`.${feed.host}`));
  return known?.name ?? host;
}
