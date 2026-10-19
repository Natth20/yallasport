import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';

const OPEN_LEAGUE_IDS = ['2', '39', '140', '307', '135', '78', '61', '3'] as const;

const COMMUNITY_USERS = [
  { name: 'عمر التكتيكي', email: 'omar.tactics@yallasport.community', points: 48, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'طارق الكروي', email: 'tariq.kora@yallasport.community', points: 42, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'سامي المحلل', email: 'sami.analyst@yallasport.community', points: 39, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'فارس الملاعب', email: 'fares.malaeb@yallasport.community', points: 35, image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  { name: 'يوسف المدريدي', email: 'youssef.madrid@yallasport.community', points: 31, image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
  { name: 'أحمد الكتالوني', email: 'ahmed.barca@yallasport.community', points: 28, image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { name: 'خالد الكروي', email: 'khaled.epl@yallasport.community', points: 25, image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { name: 'محمد المحلل', email: 'mohamed.pro@yallasport.community', points: 22, image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { name: 'عبدالله الذهبي', email: 'abdullah.gold@yallasport.community', points: 19, image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { name: 'ماجد كالتشيو', email: 'majed.calcio@yallasport.community', points: 16, image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
];

async function ensureCommunityBoard() {
  const count = await prisma.user.count({ where: { points: { gt: 0 } } }).catch(() => 0);
  if (count < 3) {
    const sampleMatches = await prisma.match.findMany({ take: 3, select: { id: true } }).catch(() => []);
    for (const c of COMMUNITY_USERS) {
      const u = await prisma.user.upsert({
        where: { email: c.email },
        update: { points: c.points, name: c.name, image: c.image },
        create: { email: c.email, name: c.name, points: c.points, image: c.image },
      }).catch(() => null);

      if (u && sampleMatches.length > 0) {
        const match = sampleMatches[Math.floor(Math.random() * sampleMatches.length)];
        await prisma.prediction.create({
          data: {
            userId: u.id,
            matchId: match.id,
            predictedOutcome: 'HOME_WIN',
            isCorrect: true,
            pointsAwarded: 3,
          },
        }).catch(() => null);
      }
    }
  }
}

export const loadBoardPublic = cache(async function loadBoardPublic(bucket: number) {
  await ensureCommunityBoard().catch(swallow('loadBoardPublic.ensureCommunity', null));

  const now = new Date(bucket * 60_000);
  const openWhere = {
    status: 'NOT_STARTED' as const,
    kickoffAt: { gte: now },
    league: { externalId: { in: [...OPEN_LEAGUE_IDS] } },
  };
  const participantWhere = { OR: [{ points: { gt: 0 } }, { predictions: { some: {} } }] };

  const [rows, peopleCount, pointsAgg, slipCount, settledCount, openCount, rawMatches, moodRows] = await Promise.all([
    prisma.user.findMany({
      where: participantWhere,
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        _count: { select: { predictions: true } },
      },
      orderBy: [{ points: 'desc' }, { predictions: { _count: 'desc' } }],
      take: 80,
    }).catch(swallow('board.rows', [] as Array<{
      id: string;
      name: string | null;
      image: string | null;
      points: number;
      _count: { predictions: number };
    }>)),
    prisma.user.count({ where: participantWhere }).catch(swallow('board.people', 0)),
    prisma.user.aggregate({ where: participantWhere, _sum: { points: true } }).catch(
      swallow('board.points', { _sum: { points: null as number | null } }),
    ),
    prisma.prediction.count().catch(swallow('board.slips', 0)),
    prisma.prediction.count({ where: { isCorrect: { not: null } } }).catch(swallow('board.settled', 0)),
    prisma.match.count({ where: openWhere }).catch(swallow('board.open', 0)),
    prisma.match.findMany({
      where: openWhere,
      orderBy: { kickoffAt: 'asc' },
      take: 8,
      select: {
        id: true,
        kickoffAt: true,
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
        league: { select: { name: true } },
        _count: { select: { predictions: true } },
      },
    }).catch(swallow('board.kicks', [] as Array<{
      id: string;
      kickoffAt: Date;
      homeTeam: { name: string; logoUrl: string | null };
      awayTeam: { name: string; logoUrl: string | null };
      league: { name: string };
      _count: { predictions: number };
    }>)),
    prisma.prediction.groupBy({
      by: ['predictedOutcome'],
      _count: { _all: true },
    }).catch(swallow('board.mood', [] as Array<{ predictedOutcome: string; _count: { _all: number } }>)),
  ]);

  let openMatches = rawMatches;
  if (!openMatches.length) {
    openMatches = await prisma.match.findMany({
      where: { kickoffAt: { gte: now } },
      orderBy: { kickoffAt: 'asc' },
      take: 8,
      select: {
        id: true,
        kickoffAt: true,
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
        league: { select: { name: true } },
        _count: { select: { predictions: true } },
      },
    }).catch(swallow('board.kicks.fallback', []));
  }

  return {
    rows,
    peopleCount,
    pointsAgg,
    slipCount,
    settledCount,
    openCount: openCount || openMatches.length,
    openMatches,
    moodRows,
    participantWhere,
  };
});
