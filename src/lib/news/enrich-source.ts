import { reportCaughtError } from '@/lib/ops/caught';
import { isTrustedNewsUrl } from '@/lib/news/trusted-sources';

const META_KEYS = [
  'og:image',
  'og:image:url',
  'twitter:image',
  'twitter:image:src',
] as const;

function absolutize(raw: string, baseUrl: string): string | null {
  try {
    const url = new URL(raw, baseUrl);
    if (!/^https?:$/i.test(url.protocol)) return null;
    return url.toString();
  } catch (error) {
    reportCaughtError("src/lib/news/enrich-source.ts:15", error);
    return null;
  }
}

function metaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      'i'
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

/** First meaningful image inside article HTML (RSS body). */
export function pickImageFromHtml(html: string, baseUrl?: string | null): string | null {
  if (!html) return null;
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  for (const match of matches) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    if (/^(data:|\/\/)/i.test(raw) && !raw.startsWith('//')) continue;
    if (/pixel|spacer|1x1|tracking|favicon|logo\.svg/i.test(raw)) continue;
    const absolute = baseUrl ? absolutize(raw.startsWith('//') ? `https:${raw}` : raw, baseUrl) : raw;
    if (absolute && /^https?:\/\//i.test(absolute)) return absolute;
  }
  return null;
}

/**
 * Fetch Open Graph / Twitter card image from a trusted article URL.
 * Real media only — never invents placeholders.
 */
export async function fetchTrustedSourceImage(sourceUrl: string | null | undefined): Promise<string | null> {
  if (!sourceUrl || !isTrustedNewsUrl(sourceUrl)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'YallaSportBot/1.0 (+https://yallasport.local; news-desk image enrich)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const html = (await response.text()).slice(0, 180_000);
    for (const key of META_KEYS) {
      const value = metaContent(html, key);
      if (!value) continue;
      const absolute = absolutize(value.startsWith('//') ? `https:${value}` : value, sourceUrl);
      if (absolute) return absolute;
    }

    return pickImageFromHtml(html, sourceUrl);
  } catch (error) {
    reportCaughtError("src/lib/news/enrich-source.ts:84", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveNewsImage(input: {
  featuredImage?: string | null;
  ogImage?: string | null;
  content?: string | null;
  sourceUrl?: string | null;
}): Promise<string | null> {
  if (input.featuredImage?.trim()) return input.featuredImage.trim();
  if (input.ogImage?.trim()) return input.ogImage.trim();

  const fromHtml = pickImageFromHtml(input.content || '', input.sourceUrl);
  if (fromHtml) return fromHtml;

  return fetchTrustedSourceImage(input.sourceUrl);
}

/** Keep the stored URL unless a known CDN thumb can be enlarged without breaking the file. */
export function upgradeNewsImageUrl(raw: string): string {
  const cleaned = raw.trim().replace(/&amp;/g, '&');
  const withProtocol = cleaned.startsWith('//') ? `https:${cleaned}` : cleaned;
  try {
    const url = new URL(withProtocol);
    if (url.protocol === 'http:') url.protocol = 'https:';
    if (!/^https:$/i.test(url.protocol)) return raw;

    if (url.hostname.includes('ichef.bbci.co.uk')) {
      url.pathname = url.pathname
        .replace(/\/news\/\d+\//i, '/news/976/')
        .replace(/\/ace\/(?:standard|ws)\/\d+\//i, '/ace/standard/976/');
    }

    const guim = url.pathname.match(/^\/img\/media\/(.+)\/master\/([^/]+)$/i);
    if ((url.hostname === 'i.guim.co.uk' || url.hostname.endsWith('.guim.co.uk')) && guim) {
      return `https://media.guim.co.uk/${guim[1]}/${guim[2]}`;
    }

    if (url.hostname.includes('skynewsarabia.com')) {
      url.pathname = url.pathname.replace(
        /\/(\d{2,4})\/(\d{2,4})\/(\d+-\d+\.(?:jpe?g|webp|png))$/i,
        (full, wide, _high, file) =>
          Number(wide) < 800 ? `/1200/675/${file}` : full,
      );
    }

    url.pathname = url.pathname.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]{3,4}$)/i, '');
    url.pathname = url.pathname
      .replace(/\/(?:thumb|thumbs|small|xs)\//gi, '/')
      .replace(/\/(?:150|200|240|320|460|640)\//g, '/1024/');

    for (const key of ['w', 'width', 'ow'] as const) {
      if (!url.searchParams.has(key)) continue;
      const wide = Number(url.searchParams.get(key) || 0);
      if (wide > 0 && wide < 900) url.searchParams.set(key, '1200');
    }

    return url.toString();
  } catch (error) {
    reportCaughtError('src/lib/news/enrich-source.ts:upgradeNewsImageUrl', error);
    return raw;
  }
}

/** Larger CDN variant for the photo hall — same file, higher width when the host allows it. */
export function upgradeGalleryImageUrl(raw: string): string {
  const base = upgradeNewsImageUrl(raw);
  try {
    const url = new URL(base);
    if (url.hostname.includes('ichef.bbci.co.uk')) {
      url.pathname = url.pathname
        .replace(/\/news\/\d+\//i, '/news/1376/')
        .replace(/\/ace\/(?:standard|ws)\/\d+\//i, '/ace/standard/1376/');
    }
    if (url.hostname.includes('skynewsarabia.com')) {
      url.pathname = url.pathname.replace(
        /\/(\d{2,4})\/(\d{2,4})\/(\d+-\d+\.(?:jpe?g|webp|png))$/i,
        '/1600/900/$3',
      );
    }
    for (const key of ['w', 'width', 'ow'] as const) {
      if (!url.searchParams.has(key)) continue;
      const wide = Number(url.searchParams.get(key) || 0);
      if (wide > 0 && wide < 1600) url.searchParams.set(key, '1600');
    }
    return url.toString();
  } catch (error) {
    reportCaughtError('src/lib/news/enrich-source.ts:upgradeGalleryImageUrl', error);
    return base;
  }
}

export function galleryImageSrcSet(raw: string): string | undefined {
  try {
    const url = new URL(upgradeNewsImageUrl(raw));
    if (url.hostname.includes('ichef.bbci.co.uk') && /\/news\/\d+\//i.test(url.pathname)) {
      return [800, 976, 1376, 1536]
        .map((wide) => `${url.toString().replace(/\/news\/\d+\//i, `/news/${wide}/`)} ${wide}w`)
        .join(', ');
    }
    if (url.hostname.includes('ichef.bbci.co.uk') && /\/ace\/(?:standard|ws)\/\d+\//i.test(url.pathname)) {
      return [800, 976, 1376, 1536]
        .map((wide) => `${url.toString().replace(/\/ace\/(?:standard|ws)\/\d+\//i, `/ace/standard/${wide}/`)} ${wide}w`)
        .join(', ');
    }
    return undefined;
  } catch (error) {
    reportCaughtError('src/lib/news/enrich-source.ts:galleryImageSrcSet', error);
    return undefined;
  }
}

function looksCompressedThumb(url: string) {
  return (
    /\/(?:thumb|thumbs|small|xs|150|200|240|320|460)\b/i.test(url) ||
    /skynewsarabia\.com\/images\/.+\d{2,3}\/\d{2,3}\/\d+-/i.test(url) ||
    /[?&](?:w|width|ow)=\d{1,3}\b/i.test(url)
  );
}

export function publicStoryImage(story: {
  featuredImage?: string | null;
  ogImage?: string | null;
}): string | null {
  const featured = story.featuredImage?.trim() || '';
  const og = story.ogImage?.trim() || '';
  const chosen =
    featured && og && looksCompressedThumb(featured) && !looksCompressedThumb(og) ? og : featured || og;
  return chosen ? upgradeNewsImageUrl(chosen) : null;
}
