import { sanitizeArticleHtml } from '@/lib/news/article-clean';

/**
 * Normalize RSS / imported bodies into readable HTML paragraphs,
 * then strip source chrome (nav, social, related stories).
 */
export function formatNewsHtml(raw: string): string {
  const input = (raw || '').trim();
  if (!input) return '';

  const hasBlockHtml = /<(p|div|br|li|h[1-6]|article|section)\b/i.test(input);
  const normalized = hasBlockHtml
    ? input
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
    : (() => {
        const plain = input
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        return plain
          .split(/\n{2,}/)
          .map((block) => block.trim())
          .filter(Boolean)
          .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
          .join('');
      })();

  return sanitizeArticleHtml(normalized);
}

export function deskAuthorLabel(
  authorName: string | null | undefined,
  locale: string,
  pick: (locale: string, ar: string, en: string) => string
) {
  const name = authorName?.trim() || '';
  if (!name || /yalla sport (desk|bot)|system@yallasport|bot/i.test(name)) {
    return '';
  }
  return name;
}
