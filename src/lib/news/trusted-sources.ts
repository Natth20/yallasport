import { reportCaughtError } from '@/lib/ops/caught';
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
  'rt.com',
  'arabic.rt.com',
  'yallakora.com',
  'filgoal.com',
  'sport360.com',
  'marca.com',
  'as.com',
  'lequipe.fr',
  'gazzetta.it',
  'kicker.de',
] as const;

/**
 * Public RSS endpoints dedicated to sports and football.
 * Only pure sports feeds to avoid general/political news contamination.
 */
export const TRUSTED_RSS_FEEDS = [
  {
    url: 'https://www.skynewsarabia.com/web/rss/sport.xml',
    name: 'سكاي نيوز عربية - رياضة',
    host: 'skynewsarabia.com',
    locale: 'ar',
  },
  {
    url: 'https://www.aljazeera.net/aljazeerarss/73d0e1b4-532f-45ef-b135-bfdff8b8cab9',
    name: 'الجزيرة رياضة',
    host: 'aljazeera.net',
    locale: 'ar',
  },
  {
    url: 'https://feeds.bbci.co.uk/arabic/sport/rss.xml',
    name: 'بي بي سي عربي - رياضة',
    host: 'bbc.co.uk',
    locale: 'ar',
  },
  {
    url: 'https://rss.dw.com/rdf/rss-ar-sports',
    name: 'DW عربية - رياضة',
    host: 'dw.com',
    locale: 'ar',
  },
  {
    url: 'https://www.france24.com/ar/%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9/rss',
    name: 'فرانس 24 - رياضة',
    host: 'france24.com',
    locale: 'ar',
  },
  {
    url: 'https://arabic.rt.com/rss/sport/',
    name: 'آر تي - رياضة',
    host: 'arabic.rt.com',
    locale: 'ar',
  },
  {
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    name: 'BBC Sport Football',
    host: 'bbc.co.uk',
    locale: 'en',
  },
  {
    url: 'https://www.skysports.com/rss/12040',
    name: 'Sky Sports Football',
    host: 'skysports.com',
    locale: 'en',
  },
  {
    url: 'https://www.theguardian.com/football/rss',
    name: 'The Guardian Football',
    host: 'theguardian.com',
    locale: 'en',
  },
] as const;

const NON_NEWS_PATTERN =
  /who\s*am\s*i|من\s*أنا|quiz|puzzle|crossword|wordle|guess\s+the|خمّن|اختبر\s*معرفتك|مسابقة|poll\b|trivia|fantasy\s*draft|live\s*blog\s*quiz/i;

export function hostFromUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, '');
    return host || null;
  } catch (error) {
    reportCaughtError("src/lib/news/trusted-sources.ts:102", error);
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
      } catch (error) {
        reportCaughtError("src/lib/news/trusted-sources.ts:130", error);
        return false;
      }
    });
  } catch (error) {
    reportCaughtError("src/lib/news/trusted-sources.ts:134", error);
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
