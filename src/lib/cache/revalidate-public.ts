import { revalidatePath } from 'next/cache';
import { reportCaughtError } from '@/lib/ops/caught';
import { frontDayWindow } from '@/lib/front/window';
import { redis } from '@/lib/redis';
import { currentFootballSeason } from '@/lib/sports-data/season';

const LOCALES = ['ar', 'en'] as const;

function bustLayout() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`, 'layout');
  }
}

function bust(paths: string[]) {
  for (const locale of LOCALES) {
    for (const path of paths) {
      revalidatePath(`/${locale}${path}`);
    }
  }
}

async function dropKeys(keys: string[]) {
  try {
    if (keys.length) await redis.del(...keys);
  } catch (error) {
    reportCaughtError('revalidate.redis.del', error);
  }
}

function frontSportKeys() {
  const { todayKey } = frontDayWindow();
  const season = String(currentFootballSeason());
  return [
    `front:pulse:${todayKey}:v2`,
    `front:board:${todayKey}:v4`,
    `front:tv:${todayKey}:v2`,
    `front:tables:${season}:v3`,
    `front:squads:${season}:v3`,
    'front:scorers:7d:v3',
    'front:predict:v3',
  ];
}

export function revalidateAfterSportsSync() {
  bustLayout();
  bust(['', '/matches', '/live', '/leagues', '/stats', '/compare', '/leaderboard', '/about']);
  void dropKeys(frontSportKeys());
}

export function revalidateAfterNewsIngest() {
  bustLayout();
  bust(['', '/news', '/photos', '/search']);
  void dropKeys(['front:news:ar:v4', 'front:news:en:v4']);
}

export function revalidateAfterYoutubeIngest() {
  bustLayout();
  bust(['', '/videos', '/videos/reels', '/videos/archive']);
  void dropKeys(['front:youtube:ar:v3', 'front:youtube:en:v3']);
}

export function revalidateAfterTransfers() {
  bustLayout();
  bust(['', '/transfers']);
  void dropKeys(['front:transfers:v2']);
}
