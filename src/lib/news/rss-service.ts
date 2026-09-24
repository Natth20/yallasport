import { prisma } from '@/lib/prisma';
import Parser from 'rss-parser';
import { detectSourceLocale } from '@/lib/i18n/translation-provider';
import { suggestNewsEntities } from '@/lib/news/entity-suggest';
import { pickRssBody, pickRssImage } from '@/lib/news/rss-fields';
import { resolveNewsImage, upgradeNewsImageUrl } from '@/lib/news/enrich-source';
import { canonicalNewsUrl, newsUrlAliases } from '@/lib/news/canonical-url';
import { clipImportedNewsCopy } from '@/lib/news/import-copy';
import { readingTimeMinutes } from '@/lib/news/reading-time';
import { pushProvenance } from '@/lib/news/provenance';
import {
  TRUSTED_RSS_FEEDS,
  displaySourceName,
  isEditorialNewsItem,
  isTrustedNewsUrl,
  isTrustedRssFeedUrl,
} from '@/lib/news/trusted-sources';
import { classifyDesk, competitionTags } from '@/lib/news/desks';
import { parseRssPublishedAt, shouldImportRssStory } from '@/lib/news/freshness';

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  image: string | null;
  source: string;
}

export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const feedTitle = feed.title || 'Unknown Source';
    return (feed.items || []).map((item) => {
      const mapped = item as typeof item & {
        contentEncoded?: string;
        mediaContent?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
        mediaThumbnail?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
      };
      return {
        title: item.title || '',
        link: item.link || '',
        pubDate: item.isoDate || item.pubDate || '',
        content: pickRssBody(mapped),
        image: pickRssImage({ ...mapped, link: item.link || '' }),
        source: feedTitle,
      };
    });
  } catch (error) {
    console.error(`[RSS_FETCH_ERROR]: Failed to fetch ${url}`, error);
    return [];
  }
}

function isNonSportsNoise(title: string, content: string) {
  const text = `${title} ${content}`.toLowerCase();
  return /الحوثيون|حوثي|غارة|غارات|قصف|صاروخ|صواريخ|معارك|عسكرية|الحرب في|أسعار الخبز|دعم الخبز|تضخم|انتخابات برلمانية|مجلس النواب|أزمة دبلوماسية|مظاهرات|اغتيال/.test(
    text
  );
}

function isFootballItem(item: RSSItem) {
  const haystack = `${item.title} ${item.content} ${item.source}`.toLowerCase();
  return /football|soccer|premier league|laliga|serie a|bundesliga|champions|uefa|fifa|afc|caf|كرة|كروية|الدوري|مباراة|مباريات|هدف|أهداف|منتخب|منتخبات|لاعب|لاعبين|مدرب|بطولة|كأس|دوري|نادي|أندية|ريال مدريد|برشلونة|ليفربول|مانشستر|الهلال|النصر|الاتحاد|الأهلي|ميسي|رونالدو|صلاح|فينيسيوس|مبابي|هالاند|مرموش|انتقالات|ميركاتو|تسديدة|ركلة/.test(
    haystack
  );
}

function looksBreaking(title: string) {
  return /breaking|urgent|عاجل|عاجـل/i.test(title);
}

export async function importFromRSS(url: string) {
  if (!isTrustedRssFeedUrl(url)) {
    throw new Error('RSS feed is not on the trusted allowlist');
  }

  const items = await fetchRSSFeed(url);
  const feed = TRUSTED_RSS_FEEDS.find((entry) => entry.url === url);

  let systemUser = await prisma.user.findUnique({
    where: { email: 'system@yallasport.com' },
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@yallasport.com',
        name: 'Yalla Sport Desk',
        role: 'SUPER_ADMIN',
      },
    });
  } else if (/bot/i.test(systemUser.name || '')) {
    systemUser = await prisma.user.update({
      where: { id: systemUser.id },
      data: { name: 'Yalla Sport Desk' },
    });
  }

  let imported = 0;

  for (const item of items) {
    if (!item.link || !item.title) continue;
    if (!isTrustedNewsUrl(item.link)) continue;
    if (!isEditorialNewsItem(item.title, item.content)) continue;
    if (isNonSportsNoise(item.title, item.content)) continue;
    if (!isFootballItem(item)) continue;

    const aliases = newsUrlAliases(item.link);
    const existingNews = await prisma.news.findFirst({
      where: {
        OR: [
          ...aliases.map((sourceUrl) => ({ sourceUrl })),
          { canonical: canonicalNewsUrl(item.link) },
        ],
      },
      select: { id: true },
    });
    if (existingNews) continue;

    const slugBase = item.title
      .toLowerCase()
      .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    const uniqueSlug = `${slugBase || 'story'}-${Date.now()}`;
    // Prefer our curated outlet name over whatever title the feed ships with,
    // so the source ledger on /news reads consistently.
    const sourceName = feed?.name ?? displaySourceName(item.source, item.link) ?? item.source ?? item.link;

    const copy = clipImportedNewsCopy({
      title: item.title,
      rssHtml: item.content,
      sourceUrl: item.link,
      sourceName,
    });
    let image = item.image;
    if (!image) {
      image = await resolveNewsImage({
        content: copy.content,
        sourceUrl: item.link,
      });
    }
    if (image) image = upgradeNewsImageUrl(image);

    const breaking = looksBreaking(item.title);
    const publishedAt = parseRssPublishedAt({ pubDate: item.pubDate });
    if (!publishedAt || !shouldImportRssStory(publishedAt)) continue;

    const created = await prisma.news.create({
      data: {
        title: item.title,
        excerpt: copy.excerpt || null,
        content: copy.content,
        featuredImage: image,
        ogImage: image,
        sourceName,
        sourceUrl: item.link,
        canonical: canonicalNewsUrl(item.link),
        slug: uniqueSlug,
        category: classifyDesk(item.title, copy.content),
        tags: ['football', 'rss', 'trusted', ...competitionTags(item.title, copy.content)],
        status: 'PENDING_REVIEW',
        publishedAt,
        breaking,
        featured: false,
        aiAssisted: false,
        authorId: systemUser.id,
        sourceLocale: detectSourceLocale(`${item.title} ${copy.excerpt} ${copy.content}`),
        readingTime: readingTimeMinutes(copy.content || copy.excerpt || item.title),
        provenance: pushProvenance(null, {
          userId: systemUser.id,
          action: 'IMPORT_RSS',
          source: sourceName,
          arrivedAt: new Date().toISOString(),
          sourcePublishedAt: publishedAt.toISOString(),
          feed: url,
          aiAssisted: false,
          fullTextCopied: copy.fullTextCopied,
          protectedSource: copy.protectedSource,
          breaking,
        }),
      },
    });

    await suggestNewsEntities({
      newsId: created.id,
      title: created.title,
      content: created.content || created.excerpt || created.title,
    });
    imported += 1;
  }

  return { imported };
}
