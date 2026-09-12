import { pickImageFromHtml } from '@/lib/news/enrich-source';
import { formatNewsHtml } from '@/lib/news/format-body';

/**
 * Prefer richer RSS body fields when available (full HTML > content > snippet).
 */
type RssLike = {
  link?: string;
  content?: string;
  contentSnippet?: string;
  contentEncoded?: string;
  summary?: string;
  enclosure?: { url?: string; type?: string };
  mediaContent?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  mediaThumbnail?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  itunes?: { image?: string };
};

export function pickRssBody(item: RssLike) {
  const encoded = typeof item.contentEncoded === 'string' ? item.contentEncoded : '';
  const content = typeof item.content === 'string' ? item.content : '';
  const summary = typeof item.summary === 'string' ? item.summary : '';
  const snippet = typeof item.contentSnippet === 'string' ? item.contentSnippet : '';
  const raw =
    [encoded, content, summary, snippet].find((value) => value.trim().length > 40) ||
    snippet ||
    content ||
    summary ||
    encoded ||
    '';
  return formatNewsHtml(raw);
}

function mediaUrl(
  value: { $?: { url?: string } } | Array<{ $?: { url?: string } }> | undefined
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.find((entry) => entry?.$?.url)?.$?.url || null;
  }
  return value.$?.url || null;
}

export function pickRssImage(item: RssLike) {
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith('image/'))) {
    return item.enclosure.url;
  }
  const fromMedia =
    mediaUrl(item.mediaContent) || mediaUrl(item.mediaThumbnail) || item.itunes?.image || null;
  if (fromMedia) return fromMedia;

  const encoded = typeof item.contentEncoded === 'string' ? item.contentEncoded : '';
  const content = typeof item.content === 'string' ? item.content : '';
  return pickImageFromHtml(encoded || content, item.link || null);
}
