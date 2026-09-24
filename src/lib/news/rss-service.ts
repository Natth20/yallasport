import { prisma } from '@/lib/prisma';
import Parser from 'rss-parser';
import { detectSourceLocale } from '@/lib/i18n/translation-provider';
import { enqueueNewsTranslation } from '@/lib/i18n/backfill';
import { suggestNewsEntities } from '@/lib/news/entity-suggest';
import { pickRssBody, pickRssImage } from '@/lib/news/rss-fields';
import { resolveNewsImage } from '@/lib/news/enrich-source';
import { resolveFullArticleBody, wordCount } from '@/lib/news/fetch-article';
import {
  TRUSTED_RSS_FEEDS,
  displaySourceName,
  isEditorialNewsItem,
  isTrustedNewsUrl,
  isTrustedRssFeedUrl,
} from '@/lib/news/trusted-sources';
import { classifyDesk, competitionTags } from '@/lib/news/desks';

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
        pubDate: item.pubDate || new Date().toISOString(),
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

    const existingNews = await prisma.news.findFirst({
      where: { sourceUrl: item.link },
    });
    if (existingNews) continue;

    const slugBase = item.title
      .toLowerCase()
      .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    const uniqueSlug = `${slugBase || 'story'}-${Date.now()}`;
    // Prefer our curated outlet name over whatever title the feed ships with,
    // so the source ledger on /news reads consistently.
    const sourceName = feed?.name ?? displaySourceName(item.source, item.link) ?? item.source;

    let body = item.content || item.title;
    let image = item.image;
    let enrichedBody = false;

    if (wordCount(body) < 120) {
      const fuller = await resolveFullArticleBody({
        content: body,
        sourceUrl: item.link,
      });
      if (fuller.enriched) {
        body = fuller.html;
        enrichedBody = true;
      }
      if (!image && fuller.image) image = fuller.image;
    }

    if (!image) {
      image = await resolveNewsImage({
        content: body,
        sourceUrl: item.link,
      });
    }

    const plainForMeta = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const breaking = looksBreaking(item.title);
    // Keep the outlet's own publication time. Stamping our import time instead
    // would collapse a week of reporting onto whatever day the cron last ran.
    const sourceDate = new Date(item.pubDate);
    const publishedAt = Number.isNaN(sourceDate.getTime()) ? new Date() : sourceDate;

    const created = await prisma.news.create({
      data: {
        title: item.title,
        excerpt: plainForMeta.slice(0, 220) || null,
        content: body,
        featuredImage: image,
        ogImage: image,
        sourceName,
        sourceUrl: item.link,
        slug: uniqueSlug,
        category: classifyDesk(item.title, plainForMeta),
        tags: [
          'football',
          'rss',
          'trusted',
          ...competitionTags(item.title, plainForMeta),
          ...(enrichedBody ? ['full-source'] : []),
        ],
        status: 'PUBLISHED',
        publishedAt,
        breaking,
        aiAssisted: false,
        authorId: systemUser.id,
        sourceLocale: detectSourceLocale(`${item.title} ${plainForMeta}`),
        readingTime: Math.max(1, Math.ceil((plainForMeta || item.title).split(/\s+/).length / 200)),
        provenance: [
          {
            timestamp: new Date().toISOString(),
            userId: systemUser.id,
            action: 'IMPORT_RSS',
            source: sourceName,
            sourcePublishedAt: publishedAt.toISOString(),
            feed: url,
            enrichedBody,
            breaking,
          },
        ],
      },
    });

    await enqueueNewsTranslation(created.id);
    await suggestNewsEntities({
      newsId: created.id,
      title: created.title,
      content: created.content,
    });
    imported += 1;
  }

  return { imported };
}
