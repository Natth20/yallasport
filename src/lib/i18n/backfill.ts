import 'server-only';

import { prisma } from '@/lib/prisma';
import { detectSourceLocale, getTranslationProvider } from '@/lib/i18n/translation-provider';

const TARGETS = ['ar', 'en'] as const;

export async function enqueueNewsTranslation(newsId: string) {
  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) return;
  const sourceLocale = news.sourceLocale || detectSourceLocale(`${news.title} ${news.content}`);
  if (news.sourceLocale !== sourceLocale) {
    await prisma.news.update({ where: { id: newsId }, data: { sourceLocale } });
  }
  const target = TARGETS.find((locale) => locale !== sourceLocale);
  if (!target) return;

  const existing = await prisma.newsTranslation.findUnique({
    where: { newsId_locale: { newsId, locale: target } }
  });
  if (existing) return;

  const provider = getTranslationProvider();
  const draft = await provider.translate({
    sourceLocale,
    targetLocale: target,
    title: news.title,
    excerpt: news.excerpt,
    content: news.content
  });
  if (!draft) return;
  await prisma.newsTranslation.create({
    data: {
      newsId,
      locale: target,
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      status: 'DRAFT',
      source: 'MACHINE',
      providerKey: draft.providerKey
    }
  });
}

export async function backfillTranslations(userId: string) {
  const [news, teams, leagues, players, channels, shows] = await Promise.all([
    prisma.news.findMany({ select: { id: true, title: true, excerpt: true, content: true, sourceLocale: true } }),
    prisma.team.findMany({ select: { id: true, name: true, bio: true } }),
    prisma.league.findMany({ select: { id: true, name: true } }),
    prisma.player.findMany({ select: { id: true, name: true } }),
    prisma.channel.findMany({ select: { id: true, name: true } }),
    prisma.show.findMany({ select: { id: true, title: true, description: true } })
  ]);

  let newsQueued = 0;
  for (const item of news) {
    const before = await prisma.newsTranslation.count({ where: { newsId: item.id } });
    await enqueueNewsTranslation(item.id);
    const after = await prisma.newsTranslation.count({ where: { newsId: item.id } });
    if (after > before) newsQueued += 1;
  }

  const provider = getTranslationProvider();
  let entitiesQueued = 0;
  const queueEntity = async (
    entityType: string,
    entityId: string,
    name: string,
    description?: string | null
  ) => {
    const existing = await prisma.entityTranslation.findUnique({
      where: { entityType_entityId_locale: { entityType, entityId, locale: 'en' } }
    });
    if (existing) return;
    const draft = await provider.translateName({
      sourceLocale: detectSourceLocale(name),
      targetLocale: 'en',
      name,
      description
    });
    if (!draft) return;
    await prisma.entityTranslation.create({
      data: {
        entityType,
        entityId,
        locale: 'en',
        name: draft.name,
        description: draft.description,
        status: 'DRAFT',
        source: 'MACHINE',
        providerKey: draft.providerKey
      }
    });
    entitiesQueued += 1;
  };

  for (const team of teams) await queueEntity('TEAM', team.id, team.name, team.bio);
  for (const league of leagues) await queueEntity('LEAGUE', league.id, league.name);
  for (const player of players) await queueEntity('PLAYER', player.id, player.name);
  for (const channel of channels) await queueEntity('CHANNEL', channel.id, channel.name);
  for (const show of shows) await queueEntity('SHOW', show.id, show.title, show.description);

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRANSLATION_BACKFILL',
      entityType: 'TranslationQueue',
      entityId: 'backfill'
    }
  });

  return { newsQueued, entitiesQueued };
}
