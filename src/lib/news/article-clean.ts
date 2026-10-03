import { wordCountPlain } from '@/lib/news/reading-time';

const CHROME_TAGS = /<(script|style|noscript|nav|aside|footer|header|form|iframe|svg|button|input|textarea)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;

const JUNK_CLASS =
  /(?:share|social|related|sidebar|widget|advert|adsbox|recommend|read-?more|more-stories|more-news|latest|popular|newsletter|breadcrumb|comments|follow|promo|also-read|rt-stories|stories-list|media-block|sharing)/i;

const JUNK_LINE =
  /^(facebook|meta|x|twitter|vk\.com|vk|telegram|whatsapp|instagram|youtube|rt stories|اضغط للمزيد|شارك|مشاركة|share|tweet|follow us|تابعونا|الأكثر قراءة|أخبار ذات صلة|اقرأ أيضا|اقرأ أيضًا|المزيد|more stories|related|recommended|you may also like)$/i;

const CUT_HEADING =
  /rt stories|اضغط للمزيد|اقرأ أيضا|اقرأ أيضًا|المزيد من الأخبار|أخبار ذات صلة|الأكثر قراءة|related stories|more from|recommended|you may also|latest news|most read|share this|تابعونا على|قنواتنا/;

const SOCIAL_HREF =
  /facebook\.com|twitter\.com|x\.com\/intent|t\.me\/|telegram\.me|vk\.com|wa\.me|whatsapp\.com|instagram\.com|ok\.ru/i;

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function plainFromHtml(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function stripChrome(html: string) {
  return html
    .replace(CHROME_TAGS, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function dropTaggedJunk(html: string) {
  return html.replace(/<([a-z0-9]+)([^>]*?)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, inner) => {
    const hay = `${attrs} ${inner.slice(0, 200)}`;
    if (JUNK_CLASS.test(attrs) || /itemprop=["'](?:articleSection|keywords)["']/i.test(attrs)) {
      return ' ';
    }
    if (SOCIAL_HREF.test(hay) && plainFromHtml(inner).length < 90) return ' ';
    if (tag.toLowerCase() === 'a' && SOCIAL_HREF.test(attrs)) return ' ';
    return full;
  });
}

function isJunkLine(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return true;
  if (JUNK_LINE.test(compact)) return true;
  if (/^(facebook|x|vk\.com|telegram)\b/i.test(compact) && compact.length < 40) return true;
  if (CUT_HEADING.test(compact) && compact.length < 80) return true;
  return false;
}

function looksLikeOtherHeadline(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length < 18 || compact.length > 110) return false;
  if (/[.!?؟。]/.test(compact)) return false;
  if (compact.split(/\s+/).length > 18) return false;
  return true;
}

type Block = { html: string; text: string };

function toBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const re = /<(p|h2|h3|h4|blockquote|ul|ol|figure)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const tag = match[1].toLowerCase();
    const inner = match[3];
    const text = plainFromHtml(inner);
    if (!text) continue;
    blocks.push({ html: `<${tag}>${inner}</${tag}>`, text });
  }
  if (blocks.length === 0) {
    const plain = plainFromHtml(html);
    if (plain) {
      for (const para of plain.split(/\n{2,}/).map((row) => row.trim()).filter(Boolean)) {
        blocks.push({ html: `<p>${para}</p>`, text: para });
      }
    }
  }
  return blocks;
}

function trimTrailingHeadlines(blocks: Block[]) {
  const kept = [...blocks];
  while (kept.length > 2) {
    const last = kept[kept.length - 1];
    const prev = kept[kept.length - 2];
    if (looksLikeOtherHeadline(last.text) && (looksLikeOtherHeadline(prev.text) || last.text.length < 70)) {
      kept.pop();
      continue;
    }
    break;
  }
  return kept;
}

export function sanitizeArticleHtml(raw: string): string {
  const input = (raw || '').trim();
  if (!input) return '';

  let html = stripChrome(input);
  html = dropTaggedJunk(html);

  const blocks = toBlocks(html);
  const kept: Block[] = [];
  for (const block of blocks) {
    if (CUT_HEADING.test(block.text) && kept.length >= 1) break;
    if (isJunkLine(block.text)) continue;
    if (SOCIAL_HREF.test(block.html) && block.text.length < 80) continue;
    const longParas = kept.filter((row) => row.text.length > 80).length;
    if (longParas >= 2 && block.text.length < 140 && /\.{2}|…/.test(block.text)) continue;
    kept.push(block);
  }

  const trimmed = trimTrailingHeadlines(kept);
  return trimmed.map((block) => block.html).join('');
}

export type ArticleValidation = {
  ok: boolean;
  reasons: string[];
  words: number;
};

export function validateArticleHtml(html: string): ArticleValidation {
  const reasons: string[] = [];
  const plain = plainFromHtml(html);
  const words = wordCountPlain(html);
  if (words < 24) reasons.push('too-short');
  if (/facebook|vk\.com|telegram|rt stories|اضغط للمزيد/i.test(plain) && words < 120) {
    reasons.push('chrome-leftover');
  }
  const lines = plain.split(/\n+/).map((row) => row.trim()).filter(Boolean);
  const junkHits = lines.filter((line) => isJunkLine(line)).length;
  if (junkHits >= 2) reasons.push('junk-lines');
  if (CUT_HEADING.test(plain)) reasons.push('related-block');
  return { ok: reasons.length === 0, reasons, words };
}

export function extractJsonLdArticleBody(rawHtml: string): string | null {
  const scripts = rawHtml.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const jsonText = script.replace(/<\/?script[^>]*>/gi, '');
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const bodies: string[] = [];
      const walk = (node: unknown) => {
        if (!node) return;
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        if (typeof node === 'object') {
          const record = node as Record<string, unknown>;
          if (typeof record.articleBody === 'string') bodies.push(record.articleBody);
          Object.values(record).forEach(walk);
        }
      };
      walk(parsed);
      const best = bodies.sort((a, b) => b.length - a.length)[0];
      if (best && plainFromHtml(best).length > 80) return best;
    } catch {
      continue;
    }
  }
  return null;
}

const SYSTEM_TAGS = new Set([
  'football',
  'rss',
  'trusted',
  'international',
  'sport',
  'sports',
  'imported',
  'syndicated',
]);

export function publicNewsTags(tags: string[] | null | undefined) {
  return (tags || []).filter((tag) => {
    const key = tag.trim().toLowerCase();
    if (!key) return false;
    if (SYSTEM_TAGS.has(key)) return false;
    return true;
  });
}
