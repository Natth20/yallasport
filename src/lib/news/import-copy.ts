import { formatNewsHtml } from '@/lib/news/format-body';
import { hostFromUrl } from '@/lib/news/trusted-sources';
import { plainNewsText, wordCountPlain } from '@/lib/news/reading-time';

/** Outlets whose full article text must not be stored. Title + excerpt + link only. */
export const PROTECTED_FULLTEXT_HOSTS = [
  'bbc.com',
  'bbc.co.uk',
  'skysports.com',
  'reuters.com',
] as const;

export function isProtectedFullTextSource(sourceUrl?: string | null) {
  const host = hostFromUrl(sourceUrl);
  if (!host) return false;
  return PROTECTED_FULLTEXT_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function summaryCard(excerpt: string, sourceName: string, sourceUrl: string) {
  const source = escapeHtml(sourceName || sourceUrl);
  const href = escapeHtml(sourceUrl);
  return `<p>${escapeHtml(excerpt)}</p><p><a href="${href}" rel="noopener noreferrer">${source}</a></p>`;
}

/** Import the RSS body we were given. Protected outlets stay summary-only. */
export function clipImportedNewsCopy(input: {
  title: string;
  rssHtml?: string | null;
  sourceUrl: string;
  sourceName: string;
}) {
  const protectedSource = isProtectedFullTextSource(input.sourceUrl);
  const excerpt = plainNewsText(input.rssHtml || input.title).slice(0, 280);
  if (protectedSource) {
    return {
      excerpt,
      content: summaryCard(excerpt, input.sourceName, input.sourceUrl),
      fullTextCopied: false,
      protectedSource: true,
    };
  }

  const html = formatNewsHtml(input.rssHtml || '');
  const words = wordCountPlain(html);
  if (words < 24) {
    return {
      excerpt,
      content: summaryCard(excerpt || input.title, input.sourceName, input.sourceUrl),
      fullTextCopied: false,
      protectedSource: false,
    };
  }

  return {
    excerpt,
    content: html,
    fullTextCopied: words >= 90,
    protectedSource: false,
  };
}
