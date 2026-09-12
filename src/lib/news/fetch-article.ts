import { formatNewsHtml } from '@/lib/news/format-body';
import { pickImageFromHtml } from '@/lib/news/enrich-source';
import { isTrustedNewsUrl } from '@/lib/news/trusted-sources';

const ARTICLE_SELECTORS = [
  '[itemprop="articleBody"]',
  'article[data-component="text-block"]',
  '.article-body',
  '.article__body',
  '.story-body',
  '.ssrcss-11r1oj1-RichTextComponentWrapper',
  '.ssrcss-7uxr49-RichTextContainer',
  '.content__article-body',
  '.article-content',
  '.entry-content',
  '.post-content',
  'article .content',
  'article',
  'main',
];

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripNoise(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<(nav|aside|footer|header|form|iframe|svg|button)[\s\S]*?<\/\1>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function extractBySelector(html: string, selector: string): string | null {
  // Attribute / class / tag lightweight extraction without a DOM parser.
  if (selector.startsWith('[itemprop="') && selector.endsWith('"]')) {
    const prop = selector.slice('[itemprop="'.length, -2);
    const re = new RegExp(
      `<([a-z0-9]+)[^>]*itemprop=["']${prop}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
      'i'
    );
    const match = html.match(re);
    return match?.[2] || null;
  }

  if (selector.startsWith('.')) {
    const cls = selector.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `<([a-z0-9]+)[^>]*class=["'][^"']*${cls}[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
      'i'
    );
    const match = html.match(re);
    return match?.[2] || null;
  }

  if (selector.includes(' ')) {
    const parts = selector.split(/\s+/);
    const outer = extractBySelector(html, parts[0]);
    if (!outer) return null;
    return extractBySelector(outer, parts.slice(1).join(' ')) || outer;
  }

  const re = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
  const match = html.match(re);
  return match?.[1] || null;
}

function keepReadableBlocks(chunk: string, baseUrl: string) {
  const blocks: string[] = [];
  const re =
    /<(p|h2|h3|h4|blockquote|ul|ol|li|figure)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(chunk))) {
    const tag = match[1].toLowerCase();
    const inner = match[3]
      .replace(/<(?!\/?(a|strong|em|b|i|br|img)\b)[^>]+>/gi, '')
      .trim();
    if (!inner || inner.replace(/<[^>]+>/g, '').trim().length < 12) continue;

    if (tag === 'figure') {
      const img = pickImageFromHtml(inner, baseUrl);
      if (img) blocks.push(`<p><img src="${img}" alt="" /></p>`);
      continue;
    }

    if (tag === 'li') {
      blocks.push(`<li>${inner}</li>`);
      continue;
    }

    blocks.push(`<${tag}>${inner}</${tag}>`);
  }

  if (blocks.length === 0) {
    return formatNewsHtml(decodeEntities(chunk.replace(/<[^>]+>/g, '\n')));
  }

  // Wrap consecutive li
  let html = '';
  let inList = false;
  for (const block of blocks) {
    if (block.startsWith('<li>')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += block;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += block;
    }
  }
  if (inList) html += '</ul>';
  return formatNewsHtml(html);
}

export function wordCount(htmlOrText: string) {
  return (htmlOrText || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

export type ScrapedArticle = {
  html: string;
  image: string | null;
  words: number;
};

/**
 * Pull a fuller article body from a trusted source page.
 * Best-effort HTML extraction — never invents copy.
 */
export async function fetchTrustedSourceArticle(
  sourceUrl: string | null | undefined
): Promise<ScrapedArticle | null> {
  if (!sourceUrl || !isTrustedNewsUrl(sourceUrl)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'YallaSportBot/1.0 (+https://yallasport.local; news-desk article enrich)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const rawHtml = stripNoise(await response.text());
    const slice = rawHtml.slice(0, 450_000);

    let best = '';
    let bestWords = 0;
    for (const selector of ARTICLE_SELECTORS) {
      const extracted = extractBySelector(slice, selector);
      if (!extracted) continue;
      const cleaned = keepReadableBlocks(extracted, sourceUrl);
      const words = wordCount(cleaned);
      if (words > bestWords) {
        best = cleaned;
        bestWords = words;
      }
      if (bestWords >= 220) break;
    }

    if (bestWords < 60) return null;

    return {
      html: best,
      image: pickImageFromHtml(best, sourceUrl),
      words: bestWords,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Prefer scraped body when it is meaningfully richer than the RSS snippet. */
export async function resolveFullArticleBody(input: {
  content?: string | null;
  sourceUrl?: string | null;
  force?: boolean;
}) {
  const current = (input.content || '').trim();
  const currentWords = wordCount(current);
  const scraped = await fetchTrustedSourceArticle(input.sourceUrl);
  if (!scraped) {
    return { html: formatNewsHtml(current), image: null as string | null, enriched: false, words: currentWords };
  }

  if (input.force || scraped.words >= currentWords + 40 || scraped.words > currentWords * 1.35) {
    return {
      html: scraped.html,
      image: scraped.image,
      enriched: true,
      words: scraped.words,
    };
  }

  return { html: formatNewsHtml(current), image: scraped.image, enriched: false, words: currentWords };
}
