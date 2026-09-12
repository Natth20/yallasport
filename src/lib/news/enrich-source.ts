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
  } catch {
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
  } catch {
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

export function publicStoryImage(story: {
  featuredImage?: string | null;
  ogImage?: string | null;
}): string | null {
  return story.featuredImage?.trim() || story.ogImage?.trim() || null;
}
