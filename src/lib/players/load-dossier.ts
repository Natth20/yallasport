import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { apiSportsPlayerPhoto } from '@/lib/sports-data/media';

async function soft<T>(run: () => Promise<T>, fallback: T, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 280 * (attempt + 1)));
      }
    }
  }
  if (process.env.NODE_ENV !== 'production' && lastError) {
    const message = lastError instanceof Error ? lastError.message : String(lastError);
    if (!message.includes('max clients') && !message.includes('EMAXCONNSESSION')) {
      console.warn('[player-dossier] query failed, using fallback', message.slice(0, 180));
    }
  }
  return fallback;
}

async function wave<T extends readonly unknown[]>(
  tasks: [...{ [K in keyof T]: () => Promise<T[K]> }]
): Promise<{ [K in keyof T]: T[K] }> {
  const out = await Promise.all(tasks.map((task) => task()));
  return out as { [K in keyof T]: T[K] };
}

function footballSeason(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 6 ? year : year - 1;
}

export type PlayerSeasonBlock = {
  team: { id: string; name: string; logoUrl: string | null };
  league: { id: string; name: string; country: string | null; logoUrl: string | null; season: number | null };
  games: {
    appearances: number | null;
    lineups: number | null;
    minutes: number | null;
    number: number | null;
    position: string | null;
    rating: string | null;
    captain: boolean;
  };
  substitutes: { in: number | null; out: number | null; bench: number | null };
  goals: { total: number | null; assists: number | null; conceded: number | null; saves: number | null };
  shots: { total: number | null; on: number | null };
  passes: { total: number | null; key: number | null; accuracy: number | null };
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  duels: { total: number | null; won: number | null };
  dribbles: { attempts: number | null; success: number | null };
  fouls: { drawn: number | null; committed: number | null };
  cards: { yellow: number | null; yellowRed: number | null; red: number | null };
  penalty: { scored: number | null; missed: number | null; saved: number | null };
};

export type PlayerSeasonTotals = {
  season: number | null;
  appearances: number;
  lineups: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOn: number;
  passes: number;
  keyPasses: number;
  passAccuracy: number | null;
  tackles: number;
  blocks: number;
  interceptions: number;
  duels: number;
  duelsWon: number;
  dribbles: number;
  dribbleAttempts: number;
  foulsDrawn: number;
  foulsCommitted: number;
  yellow: number;
  yellowRed: number;
  red: number;
  penaltiesScored: number;
  penaltiesMissed: number;
  saves: number;
  conceded: number;
  subsIn: number;
  subsOut: number;
  bench: number;
  rating: string | null;
};

export type PlayerRates = {
  goalsPer90: number | null;
  assistsPer90: number | null;
  shotAccuracy: number | null;
  duelWinPct: number | null;
  dribbleSuccessPct: number | null;
};

export type PlayerProfileBar = {
  key: string;
  labelAr: string;
  labelEn: string;
  value: number;
  max: number;
  suffix?: string;
};

export type PlayerDossierData = {
  player: {
    id: string;
    externalId: string;
    name: string;
    slug: string;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
    position: string | null;
    nationality: string | null;
    birthDate: Date | null;
    birthPlace: string | null;
    birthCountry: string | null;
    age: number | null;
    height: string | null;
    weight: string | null;
    injured: boolean | null;
  };
  currentClub: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    shirtNumber: number | null;
  } | null;
  clubHistory: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    shirtNumber: number | null;
    from: Date | null;
    to: Date | null;
  }>;
  apiClubs: Array<{
    team: { id: string; name: string; logoUrl: string | null };
    seasons: number[];
  }>;
  totals: {
    goals: number;
    penalties: number;
    assists: number;
    yellow: number;
    red: number;
    appearancesHint: number;
  };
  seasonBlocks: PlayerSeasonBlock[];
  seasonLabel: number | null;
  seasonTotals: PlayerSeasonTotals | null;
  prevSeasonTotals: PlayerSeasonTotals | null;
  olderSeasonTotals: PlayerSeasonTotals | null;
  rates: PlayerRates | null;
  profileBars: PlayerProfileBar[];
  trophies: Array<{ league: string; country: string | null; season: string; place: string | null }>;
  sidelined: Array<{ type: string; start: string | null; end: string | null }>;
  timeline: Array<{
    id: string;
    type: string;
    minute: number;
    extraMinute: number | null;
    detail: string | null;
    assistName: string | null;
    match: {
      id: string;
      kickoffAt: Date;
      homeScore: number | null;
      awayScore: number | null;
      homeTeam: { name: string; logoUrl: string | null };
      awayTeam: { name: string; logoUrl: string | null };
      league: { name: string; slug: string };
    };
  }>;
  transfers: Array<{
    id: string;
    date: Date;
    fee: string | null;
    type: string | null;
    fromTeam: string | null;
    toTeam: string | null;
  }>;
  news: Array<{
    id: string;
    slug: string;
    title: string;
    shortTitle?: string;
    excerpt?: string;
    featuredImage?: string;
    category: string;
    publishedAt: Date;
    readingTime?: number;
    sourceName?: string;
  }>;
  teammates: Array<{
    slug: string;
    name: string;
    photoUrl: string | null;
    position: string | null;
    shirtNumber: number | null;
  }>;
  clubFixtures: {
    upcoming: Array<{
      id: string;
      status: string;
      kickoffAt: Date;
      homeScore: number | null;
      awayScore: number | null;
      homeTeam: { name: string; logoUrl: string | null };
      awayTeam: { name: string; logoUrl: string | null };
      league: { name: string };
    }>;
    recent: Array<{
      id: string;
      status: string;
      kickoffAt: Date;
      homeScore: number | null;
      awayScore: number | null;
      homeTeam: { name: string; logoUrl: string | null };
      awayTeam: { name: string; logoUrl: string | null };
      league: { name: string };
    }>;
  };
};

type ApiPlayerPayload = {
  response?: Array<{
    player?: {
      id?: number;
      name?: string;
      firstname?: string;
      lastname?: string;
      age?: number;
      birth?: { date?: string; place?: string; country?: string };
      nationality?: string;
      height?: string;
      weight?: string;
      injured?: boolean;
      photo?: string;
    };
    statistics?: Array<{
      team?: { id?: number; name?: string; logo?: string };
      league?: { id?: number; name?: string; country?: string; logo?: string; season?: number };
      games?: {
        appearences?: number | null;
        appearances?: number | null;
        lineups?: number | null;
        minutes?: number | null;
        number?: number | null;
        position?: string | null;
        rating?: string | null;
        captain?: boolean;
      };
      substitutes?: { in?: number | null; out?: number | null; bench?: number | null };
      goals?: { total?: number | null; assists?: number | null; conceded?: number | null; saves?: number | null };
      shots?: { total?: number | null; on?: number | null };
      passes?: { total?: number | null; key?: number | null; accuracy?: number | null };
      tackles?: { total?: number | null; blocks?: number | null; interceptions?: number | null };
      duels?: { total?: number | null; won?: number | null };
      dribbles?: { attempts?: number | null; success?: number | null };
      fouls?: { drawn?: number | null; committed?: number | null };
      cards?: { yellow?: number | null; yellowred?: number | null; red?: number | null };
      penalty?: { scored?: number | null; missed?: number | null; saved?: number | null };
    }>;
  }>;
};

type ApiTransferPayload = {
  response?: Array<{
    transfers?: Array<{
      date?: string;
      type?: string;
      teams?: { in?: { name?: string }; out?: { name?: string } };
    }>;
  }>;
};

type ApiTrophyPayload = {
  response?: Array<{
    league?: string;
    country?: string;
    season?: string;
    place?: string;
  }>;
};

type ApiTeamsPayload = {
  response?: Array<{
    team?: { id?: number; name?: string; logo?: string };
    seasons?: number[];
  }>;
};

type ApiSidelinedPayload = {
  response?: Array<{ type?: string; start?: string; end?: string }>;
};

type ApiStatRow = NonNullable<
  NonNullable<NonNullable<ApiPlayerPayload['response']>[number]['statistics']>[number]
>;

function mapSeasonBlock(row: ApiStatRow): PlayerSeasonBlock | null {
  if (!row?.team?.name || !row.league?.name) return null;
  const appearances = row.games?.appearences ?? row.games?.appearances ?? null;
  return {
    team: {
      id: String(row.team.id || ''),
      name: row.team.name,
      logoUrl: row.team.logo || null,
    },
    league: {
      id: String(row.league.id || ''),
      name: row.league.name,
      country: row.league.country || null,
      logoUrl: row.league.logo || null,
      season: row.league.season ?? null,
    },
    games: {
      appearances,
      lineups: row.games?.lineups ?? null,
      minutes: row.games?.minutes ?? null,
      number: row.games?.number ?? null,
      position: row.games?.position ?? null,
      rating: row.games?.rating ?? null,
      captain: Boolean(row.games?.captain),
    },
    substitutes: {
      in: row.substitutes?.in ?? null,
      out: row.substitutes?.out ?? null,
      bench: row.substitutes?.bench ?? null,
    },
    goals: {
      total: row.goals?.total ?? null,
      assists: row.goals?.assists ?? null,
      conceded: row.goals?.conceded ?? null,
      saves: row.goals?.saves ?? null,
    },
    shots: { total: row.shots?.total ?? null, on: row.shots?.on ?? null },
    passes: {
      total: row.passes?.total ?? null,
      key: row.passes?.key ?? null,
      accuracy: row.passes?.accuracy ?? null,
    },
    tackles: {
      total: row.tackles?.total ?? null,
      blocks: row.tackles?.blocks ?? null,
      interceptions: row.tackles?.interceptions ?? null,
    },
    duels: { total: row.duels?.total ?? null, won: row.duels?.won ?? null },
    dribbles: {
      attempts: row.dribbles?.attempts ?? null,
      success: row.dribbles?.success ?? null,
    },
    fouls: {
      drawn: row.fouls?.drawn ?? null,
      committed: row.fouls?.committed ?? null,
    },
    cards: {
      yellow: row.cards?.yellow ?? null,
      yellowRed: row.cards?.yellowred ?? null,
      red: row.cards?.red ?? null,
    },
    penalty: {
      scored: row.penalty?.scored ?? null,
      missed: row.penalty?.missed ?? null,
      saved: row.penalty?.saved ?? null,
    },
  };
}

function sumSeason(blocks: PlayerSeasonBlock[], seasonHint: number | null = null): PlayerSeasonTotals | null {
  if (blocks.length === 0) return null;
  let appearances = 0;
  let lineups = 0;
  let minutes = 0;
  let goals = 0;
  let assists = 0;
  let shots = 0;
  let shotsOn = 0;
  let passes = 0;
  let keyPasses = 0;
  let passAccSum = 0;
  let passAccCount = 0;
  let tackles = 0;
  let tackleBlocks = 0;
  let interceptions = 0;
  let duels = 0;
  let duelsWon = 0;
  let dribbles = 0;
  let dribbleAttempts = 0;
  let foulsDrawn = 0;
  let foulsCommitted = 0;
  let yellow = 0;
  let yellowRed = 0;
  let red = 0;
  let penaltiesScored = 0;
  let penaltiesMissed = 0;
  let saves = 0;
  let conceded = 0;
  let subsIn = 0;
  let subsOut = 0;
  let bench = 0;
  const ratings: number[] = [];
  const seasons = new Set<number>();

  for (const block of blocks) {
    if (block.league.season != null) seasons.add(block.league.season);
    appearances += block.games.appearances || 0;
    lineups += block.games.lineups || 0;
    minutes += block.games.minutes || 0;
    goals += block.goals.total || 0;
    assists += block.goals.assists || 0;
    shots += block.shots.total || 0;
    shotsOn += block.shots.on || 0;
    passes += block.passes.total || 0;
    keyPasses += block.passes.key || 0;
    if (block.passes.accuracy != null) {
      passAccSum += block.passes.accuracy;
      passAccCount += 1;
    }
    tackles += block.tackles.total || 0;
    tackleBlocks += block.tackles.blocks || 0;
    interceptions += block.tackles.interceptions || 0;
    duels += block.duels.total || 0;
    duelsWon += block.duels.won || 0;
    dribbles += block.dribbles.success || 0;
    dribbleAttempts += block.dribbles.attempts || 0;
    foulsDrawn += block.fouls.drawn || 0;
    foulsCommitted += block.fouls.committed || 0;
    yellow += block.cards.yellow || 0;
    yellowRed += block.cards.yellowRed || 0;
    red += block.cards.red || 0;
    penaltiesScored += block.penalty.scored || 0;
    penaltiesMissed += block.penalty.missed || 0;
    saves += block.goals.saves || 0;
    conceded += block.goals.conceded || 0;
    subsIn += block.substitutes.in || 0;
    subsOut += block.substitutes.out || 0;
    bench += block.substitutes.bench || 0;
    const rating = block.games.rating ? Number(block.games.rating) : NaN;
    if (!Number.isNaN(rating) && rating > 0) ratings.push(rating);
  }

  return {
    season: seasonHint ?? (seasons.size === 1 ? [...seasons][0] : null),
    appearances,
    lineups,
    minutes,
    goals,
    assists,
    shots,
    shotsOn,
    passes,
    keyPasses,
    passAccuracy: passAccCount > 0 ? Math.round(passAccSum / passAccCount) : null,
    tackles,
    blocks: tackleBlocks,
    interceptions,
    duels,
    duelsWon,
    dribbles,
    dribbleAttempts,
    foulsDrawn,
    foulsCommitted,
    yellow,
    yellowRed,
    red,
    penaltiesScored,
    penaltiesMissed,
    saves,
    conceded,
    subsIn,
    subsOut,
    bench,
    rating: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null,
  };
}

function buildRates(totals: PlayerSeasonTotals): PlayerRates {
  const per90 = (value: number) =>
    totals.minutes > 0 ? Number(((value * 90) / totals.minutes).toFixed(2)) : null;
  return {
    goalsPer90: totals.goals > 0 || totals.minutes > 0 ? per90(totals.goals) : null,
    assistsPer90: totals.assists > 0 || totals.minutes > 0 ? per90(totals.assists) : null,
    shotAccuracy:
      totals.shots > 0 ? Math.round((totals.shotsOn / totals.shots) * 100) : null,
    duelWinPct: totals.duels > 0 ? Math.round((totals.duelsWon / totals.duels) * 100) : null,
    dribbleSuccessPct:
      totals.dribbleAttempts > 0
        ? Math.round((totals.dribbles / totals.dribbleAttempts) * 100)
        : null,
  };
}

function buildProfileBars(totals: PlayerSeasonTotals): PlayerProfileBar[] {
  const candidates: PlayerProfileBar[] = [
    {
      key: 'goals',
      labelAr: 'الأهداف',
      labelEn: 'Goals',
      value: totals.goals,
      max: Math.max(totals.goals, 10),
    },
    {
      key: 'assists',
      labelAr: 'الصناعات',
      labelEn: 'Assists',
      value: totals.assists,
      max: Math.max(totals.assists, 8),
    },
    {
      key: 'shots',
      labelAr: 'التسديدات',
      labelEn: 'Shots',
      value: totals.shots,
      max: Math.max(totals.shots, 30),
    },
    {
      key: 'shotsOn',
      labelAr: 'على المرمى',
      labelEn: 'Shots on',
      value: totals.shotsOn,
      max: Math.max(totals.shotsOn, 20),
    },
    {
      key: 'key',
      labelAr: 'تمريرات حاسمة',
      labelEn: 'Key passes',
      value: totals.keyPasses,
      max: Math.max(totals.keyPasses, 20),
    },
    {
      key: 'tackles',
      labelAr: 'قطع الكرات',
      labelEn: 'Tackles',
      value: totals.tackles,
      max: Math.max(totals.tackles, 20),
    },
    {
      key: 'duels',
      labelAr: 'ثنائيات فائزة',
      labelEn: 'Duels won',
      value: totals.duelsWon,
      max: Math.max(totals.duelsWon, 40),
    },
    {
      key: 'dribbles',
      labelAr: 'مراوغات ناجحة',
      labelEn: 'Dribbles',
      value: totals.dribbles,
      max: Math.max(totals.dribbles, 20),
    },
    {
      key: 'minutes',
      labelAr: 'الدقائق',
      labelEn: 'Minutes',
      value: totals.minutes,
      max: Math.max(totals.minutes, 900),
    },
  ];
  return candidates.filter((row) => row.value > 0);
}

const playerRowSelect = {
  id: true,
  externalId: true,
  name: true,
  slug: true,
  photoUrl: true,
  position: true,
  nationality: true,
  birthDate: true,
} as const;

export async function findPlayerRowBySlug(slug: string) {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug).trim();
    } catch {
      return slug.trim();
    }
  })();
  if (!decoded) return null;
  const tail = decoded.match(/(\d{3,})$/)?.[1] ?? null;
  const nameGuess = decoded.replace(/-\d+$/, '').replace(/-/g, ' ').trim();

  const exact = await soft(
    () =>
      prisma.player.findFirst({
        where: {
          OR: [
            { slug: decoded },
            { slug },
            ...(tail ? [{ externalId: tail }, { slug: { endsWith: `-${tail}` } }] : []),
          ],
        },
        select: playerRowSelect,
      }),
    null
  );
  if (exact) return exact;

  const candidates = await soft(
    () =>
      prisma.player.findMany({
        where: {
          OR: [
            { slug: { startsWith: `${decoded}-`, mode: 'insensitive' } },
            { slug: { startsWith: `${nameGuess.replace(/\s+/g, '-')}-`, mode: 'insensitive' } },
            { name: { equals: nameGuess, mode: 'insensitive' } },
            { name: { contains: nameGuess, mode: 'insensitive' } },
          ],
        },
        take: 12,
        select: playerRowSelect,
      }),
    []
  );
  if (candidates.length === 0) return null;
  const named = candidates.find((row) => row.name.toLowerCase() === nameGuess.toLowerCase());
  if (named) return named;
  return [...candidates].sort((a, b) => a.slug.length - b.slug.length)[0] ?? null;
}

export const loadPlayerDossier = cache(async function loadPlayerDossier(slug: string): Promise<PlayerDossierData | null> {
  const playerRow = await findPlayerRowBySlug(slug);

  if (!playerRow) return null;

  const season = footballSeason();
  const ext = encodeURIComponent(playerRow.externalId);
  const apiTeamsEarly = await soft(() => sportsData.getRaw<ApiTeamsPayload>(`/players/teams?player=${ext}`), null);
  const discoveredSeasons = [
    ...new Set(
      (apiTeamsEarly?.response || []).flatMap((row) => (Array.isArray(row.seasons) ? row.seasons : [])),
    ),
  ]
    .filter((value): value is number => typeof value === 'number')
    .sort((a, b) => b - a);
  const seasonsToLoad = (discoveredSeasons.length > 0 ? discoveredSeasons : [season, season - 1, season - 2, season - 3]).slice(0, 4);

  const [
    teams,
    events,
    transfersDb,
    newsRows,
    seasonPayloads,
    apiTransfers,
    apiTrophies,
    apiSidelined,
  ] = await wave([
    () =>
      soft(
        () =>
          prisma.playerTeam.findMany({
            where: { playerId: playerRow.id },
            orderBy: [{ to: 'desc' }, { from: 'desc' }],
            select: {
              shirtNumber: true,
              from: true,
              to: true,
              team: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.matchEvent.findMany({
            where: {
              OR: [{ playerId: playerRow.id }, { playerName: playerRow.name }],
              type: { in: ['GOAL', 'PENALTY', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'] },
            },
            orderBy: [{ match: { kickoffAt: 'desc' } }, { minute: 'desc' }],
            take: 48,
            select: {
              id: true,
              type: true,
              minute: true,
              extraMinute: true,
              detail: true,
              assistName: true,
              match: {
                select: {
                  id: true,
                  kickoffAt: true,
                  homeScore: true,
                  awayScore: true,
                  homeTeam: { select: { name: true, logoUrl: true } },
                  awayTeam: { select: { name: true, logoUrl: true } },
                  league: { select: { name: true, slug: true } },
                },
              },
            },
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.transfer.findMany({
            where: { playerId: playerRow.id },
            orderBy: { date: 'desc' },
            take: 24,
            select: { id: true, date: true, fee: true, fromTeam: true, toTeam: true },
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.news.findMany({
            where: {
              status: 'PUBLISHED',
              OR: [
                { title: { contains: playerRow.name } },
                { content: { contains: playerRow.name } },
                { tags: { has: playerRow.name } },
                {
                  entityLinks: {
                    some: { entityType: 'PLAYER', entityId: playerRow.id },
                  },
                },
              ],
            },
            orderBy: { publishedAt: 'desc' },
            take: 12,
            select: {
              id: true,
              slug: true,
              title: true,
              shortTitle: true,
              excerpt: true,
              featuredImage: true,
              category: true,
              publishedAt: true,
              readingTime: true,
              sourceName: true,
            },
          }),
        []
      ),
    () =>
      Promise.all(
        seasonsToLoad.map((year) =>
          soft(() => sportsData.getRaw<ApiPlayerPayload>(`/players?id=${ext}&season=${year}`), null),
        ),
      ),
    () => soft(() => sportsData.getRaw<ApiTransferPayload>(`/transfers?player=${ext}`), null),
    () => soft(() => sportsData.getRaw<ApiTrophyPayload>(`/trophies?player=${ext}`), null),
    () => soft(() => sportsData.getRaw<ApiSidelinedPayload>(`/sidelined?player=${ext}`), null),
  ]);

  const apiTeams = apiTeamsEarly;
  const blocksBySeason = seasonPayloads.map((payload, index) => ({
    season: seasonsToLoad[index] ?? null,
    blocks: (payload?.response?.[0]?.statistics || []).map((row) => mapSeasonBlock(row)).filter(Boolean) as PlayerSeasonBlock[],
    player: payload?.response?.[0]?.player,
  }));
  const seasonBlocks = blocksBySeason
    .flatMap((row) => row.blocks)
    .filter((block) => (block.games.appearances || 0) > 0 || (block.goals.total || 0) > 0 || (block.games.minutes || 0) > 0)
    .sort((a, b) => {
      const seasonDiff = (b.league.season || 0) - (a.league.season || 0);
      if (seasonDiff !== 0) return seasonDiff;
      return (b.games.appearances || 0) - (a.games.appearances || 0);
    });

  const apiProfile = blocksBySeason.find((row) => row.player?.name)?.player;

  const birthDate =
    playerRow.birthDate ||
    (apiProfile?.birth?.date ? new Date(apiProfile.birth.date) : null);
  const age =
    typeof apiProfile?.age === 'number'
      ? apiProfile.age
      : birthDate
        ? Math.max(15, new Date().getFullYear() - birthDate.getFullYear())
        : null;

  if (apiProfile) {
    const patch: {
      photoUrl?: string;
      nationality?: string;
      position?: string;
      birthDate?: Date;
    } = {};
    if (!playerRow.photoUrl && apiProfile.photo) patch.photoUrl = apiProfile.photo;
    if (!playerRow.nationality && apiProfile.nationality) patch.nationality = apiProfile.nationality;
    if (!playerRow.position && seasonBlocks[0]?.games.position) {
      patch.position = seasonBlocks[0].games.position;
    }
    if (!playerRow.birthDate && birthDate && !Number.isNaN(birthDate.getTime())) {
      patch.birthDate = birthDate;
    }
    if (Object.keys(patch).length > 0) {
      await soft(() => prisma.player.update({ where: { id: playerRow.id }, data: patch }), null);
    }
  }

  const current = teams.find((row) => row.to == null) || teams[0] || null;
  const clubHistory = teams.map((row) => ({
    id: row.team.id,
    name: row.team.name,
    slug: row.team.slug,
    logoUrl: row.team.logoUrl,
    shirtNumber: row.shirtNumber,
    from: row.from,
    to: row.to,
  }));

  const apiClubs =
    apiTeams?.response
      ?.map((row) => {
        if (!row.team?.name) return null;
        return {
          team: {
            id: String(row.team.id || ''),
            name: row.team.name,
            logoUrl: row.team.logo || null,
          },
          seasons: Array.isArray(row.seasons) ? row.seasons : [],
        };
      })
      .filter(Boolean)
      .slice(0, 16) || [];

  let goals = 0;
  let penalties = 0;
  let yellow = 0;
  let red = 0;
  for (const event of events) {
    if (event.type === 'GOAL') goals += 1;
    if (event.type === 'PENALTY') {
      goals += 1;
      penalties += 1;
    }
    if (event.type === 'YELLOW_CARD') yellow += 1;
    if (event.type === 'RED_CARD') red += 1;
  }

  const rankedSeasons = [
    ...new Set(seasonBlocks.map((block) => block.league.season).filter((value): value is number => typeof value === 'number')),
  ].sort((a, b) => b - a);
  const focusSeason = rankedSeasons[0] ?? seasonsToLoad[0] ?? season;
  const seasonTotals = sumSeason(
    seasonBlocks.filter((block) => block.league.season === focusSeason),
    focusSeason
  );
  const prevSeasonTotals =
    rankedSeasons[1] != null
      ? sumSeason(seasonBlocks.filter((block) => block.league.season === rankedSeasons[1]), rankedSeasons[1])
      : null;
  const olderSeasonTotals =
    rankedSeasons[2] != null
      ? sumSeason(seasonBlocks.filter((block) => block.league.season === rankedSeasons[2]), rankedSeasons[2])
      : null;
  const rates = seasonTotals ? buildRates(seasonTotals) : null;

  const assists = seasonTotals?.assists || 0;
  if (seasonTotals) {
    if (goals === 0 && seasonTotals.goals > 0) goals = seasonTotals.goals;
    if (penalties === 0 && seasonTotals.penaltiesScored > 0) penalties = seasonTotals.penaltiesScored;
    if (yellow === 0 && seasonTotals.yellow > 0) yellow = seasonTotals.yellow;
    if (red === 0 && seasonTotals.red > 0) red = seasonTotals.red;
  }

  const profileBars = seasonTotals ? buildProfileBars(seasonTotals) : [];
  const shirtFromApi = seasonBlocks.find((b) => b.games.number != null)?.games.number ?? null;

  const trophies =
    apiTrophies?.response
      ?.map((row) => {
        if (!row.league || !row.season) return null;
        return {
          league: row.league,
          country: row.country || null,
          season: row.season,
          place: row.place || null,
        };
      })
      .filter(Boolean)
      .slice(0, 40) || [];

  const sidelined =
    apiSidelined?.response
      ?.map((row) => {
        if (!row.type) return null;
        return {
          type: row.type,
          start: row.start || null,
          end: row.end || null,
        };
      })
      .filter(Boolean)
      .slice(0, 14) || [];

  const apiTransferRows =
    apiTransfers?.response?.[0]?.transfers?.map((row, index) => ({
      id: `api-${index}-${row.date || index}`,
      date: row.date ? new Date(row.date) : new Date(0),
      fee: null as string | null,
      type: row.type || null,
      fromTeam: row.teams?.out?.name || null,
      toTeam: row.teams?.in?.name || null,
    })) || [];

  const feeByKey = new Map(
    transfersDb.map((row) => [
      `${row.date.toISOString().slice(0, 10)}|${row.fromTeam || ''}|${row.toTeam || ''}`,
      row.fee,
    ]),
  );
  const transfers = (
    apiTransferRows.length > 0
      ? apiTransferRows.map((row) => {
        const key = `${row.date.toISOString().slice(0, 10)}|${row.fromTeam || ''}|${row.toTeam || ''}`;
        return { ...row, fee: row.fee || feeByKey.get(key) || null };
      })
      : transfersDb.map((row) => ({
        id: row.id,
        date: row.date,
        fee: row.fee,
        type: null as string | null,
        fromTeam: row.fromTeam,
        toTeam: row.toTeam,
      }))
  ).filter((row) => !Number.isNaN(row.date.getTime()) && row.date.getTime() > 0);

  const clubId = current?.team.id;
  const matchLite = {
    id: true,
    status: true,
    kickoffAt: true,
    homeScore: true,
    awayScore: true,
    homeTeam: { select: { name: true, logoUrl: true } },
    awayTeam: { select: { name: true, logoUrl: true } },
    league: { select: { name: true } },
  } as const;
  const [teammateRows, upcomingClub, recentClub] = clubId
    ? await wave([
      () =>
        soft(
          () =>
            prisma.playerTeam.findMany({
              where: { teamId: clubId, to: null, playerId: { not: playerRow.id } },
              take: 16,
              orderBy: [{ shirtNumber: 'asc' }],
              select: {
                shirtNumber: true,
                player: { select: { slug: true, name: true, photoUrl: true, position: true, externalId: true } },
              },
            }),
          []
        ),
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: clubId }, { awayTeamId: clubId }],
                status: { in: ['NOT_STARTED', 'LIVE', 'HALFTIME'] },
              },
              orderBy: { kickoffAt: 'asc' },
              take: 4,
              select: matchLite,
            }),
          []
        ),
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: clubId }, { awayTeamId: clubId }],
                status: 'FINISHED',
              },
              orderBy: { kickoffAt: 'desc' },
              take: 6,
              select: matchLite,
            }),
          []
        ),
    ])
    : [[], [], []];

  const teammates = teammateRows.map((row) => ({
    slug: row.player.slug,
    name: row.player.name,
    photoUrl: apiSportsPlayerPhoto(row.player.externalId, row.player.photoUrl),
    position: row.player.position,
    shirtNumber: row.shirtNumber,
  }));
  const clubFixtures = { upcoming: upcomingClub, recent: recentClub };

  const news = newsRows
    .filter((row): row is typeof row & { publishedAt: Date } => Boolean(row.publishedAt))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortTitle: row.shortTitle ?? undefined,
      excerpt: row.excerpt ?? undefined,
      featuredImage: row.featuredImage ?? undefined,
      category: row.category,
      publishedAt: row.publishedAt,
      readingTime: row.readingTime || undefined,
      sourceName: row.sourceName ?? undefined,
    }));

  return {
    player: {
      id: playerRow.id,
      externalId: playerRow.externalId,
      name: playerRow.name,
      slug: playerRow.slug,
      firstName: apiProfile?.firstname || null,
      lastName: apiProfile?.lastname || null,
      photoUrl: apiSportsPlayerPhoto(playerRow.externalId, playerRow.photoUrl || apiProfile?.photo || null),
      position: playerRow.position || seasonBlocks[0]?.games.position || null,
      nationality: playerRow.nationality || apiProfile?.nationality || null,
      birthDate,
      birthPlace: apiProfile?.birth?.place || null,
      birthCountry: apiProfile?.birth?.country || null,
      age,
      height: apiProfile?.height || null,
      weight: apiProfile?.weight || null,
      injured: typeof apiProfile?.injured === 'boolean' ? apiProfile.injured : null,
    },
    currentClub: current
      ? {
        id: current.team.id,
        name: current.team.name,
        slug: current.team.slug,
        logoUrl: current.team.logoUrl,
        shirtNumber: current.shirtNumber ?? shirtFromApi,
      }
      : null,
    clubHistory,
    apiClubs: apiClubs as PlayerDossierData['apiClubs'],
    totals: {
      goals,
      penalties,
      assists,
      yellow,
      red,
      appearancesHint: seasonTotals?.appearances || events.length,
    },
    seasonBlocks,
    seasonLabel: focusSeason,
    seasonTotals,
    prevSeasonTotals,
    olderSeasonTotals,
    rates,
    profileBars,
    trophies: trophies as PlayerDossierData['trophies'],
    sidelined: sidelined as PlayerDossierData['sidelined'],
    timeline: events.map((event) => ({
      id: event.id,
      type: event.type,
      minute: event.minute,
      extraMinute: event.extraMinute,
      detail: event.detail,
      assistName: event.assistName,
      match: event.match,
    })),
    transfers,
    news,
    teammates,
    clubFixtures,
  };
});

export type PlayerCompareCard = {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  position: string | null;
  nationality: string | null;
  age: number | null;
  club: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  season: number | null;
  totals: PlayerSeasonTotals | null;
  rates: PlayerRates | null;
  competitions: string[];
};

/** Season stats from the football API — not sparse local match-event counts. */
export const loadPlayerCompareCard = cache(async function loadPlayerCompareCard(
  slug: string,
  seasonYear?: number,
): Promise<PlayerCompareCard | null> {
  const playerRow = await findPlayerRowBySlug(slug);
  if (!playerRow) return null;

  const season = seasonYear ?? footballSeason();
  const pinnedSeason = seasonYear != null;
  const ext = encodeURIComponent(playerRow.externalId);

  const [clubRows, apiPlayer, apiPlayerPrev] = await wave([
    () =>
      soft(
        () =>
          prisma.playerTeam.findMany({
            where: { playerId: playerRow.id, to: null },
            take: 1,
            select: {
              team: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
          }),
        [],
      ),
    () => soft(() => sportsData.getRaw<ApiPlayerPayload>(`/players?id=${ext}&season=${season}`), null),
    () =>
      pinnedSeason
        ? Promise.resolve(null)
        : soft(() => sportsData.getRaw<ApiPlayerPayload>(`/players?id=${ext}&season=${season - 1}`), null),
  ]);

  const currentBlocks = (apiPlayer?.response?.[0]?.statistics || [])
    .map((row) => mapSeasonBlock(row))
    .filter(Boolean) as PlayerSeasonBlock[];
  const prevBlocks = (apiPlayerPrev?.response?.[0]?.statistics || [])
    .map((row) => mapSeasonBlock(row))
    .filter(Boolean) as PlayerSeasonBlock[];
  const blocks = currentBlocks.length > 0 ? currentBlocks : prevBlocks;
  const totals = sumSeason(blocks, currentBlocks.length > 0 ? season : season - 1);
  const apiProfile = apiPlayer?.response?.[0]?.player || apiPlayerPrev?.response?.[0]?.player;
  const birthDate =
    playerRow.birthDate || (apiProfile?.birth?.date ? new Date(apiProfile.birth.date) : null);
  const age =
    typeof apiProfile?.age === 'number'
      ? apiProfile.age
      : birthDate
        ? Math.max(15, new Date().getFullYear() - birthDate.getFullYear())
        : null;
  const clubFromApi = blocks[0]?.team;
  const clubFromLedger = clubRows[0]?.team ?? null;
  let club = clubFromLedger;
  if (!club && clubFromApi?.id) {
    const mapped = await soft(
      () =>
        prisma.team.findFirst({
          where: { externalId: clubFromApi.id },
          select: { id: true, name: true, slug: true, logoUrl: true },
        }),
      null,
    );
    club = mapped
      ? mapped
      : { id: clubFromApi.id, name: clubFromApi.name, slug: '', logoUrl: clubFromApi.logoUrl };
  }

  return {
    id: playerRow.id,
    slug: playerRow.slug,
    name: playerRow.name,
    photoUrl: playerRow.photoUrl || apiProfile?.photo || null,
    position: playerRow.position || blocks[0]?.games.position || null,
    nationality: playerRow.nationality || apiProfile?.nationality || null,
    age,
    club,
    season: totals?.season ?? (blocks.length ? blocks[0]?.league.season ?? null : null),
    totals,
    rates: totals ? buildRates(totals) : null,
    competitions: [...new Set(blocks.map((block) => block.league.name).filter(Boolean))],
  };
});

const COMPARE_FACE_NEEDLES = [
  'Mohamed Salah',
  'Riyad Mahrez',
  'Erling Haaland',
  'Kylian Mbappe',
  'Vinicius',
  'Jude Bellingham',
  'Lamine Yamal',
  'Harry Kane',
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Robert Lewandowski',
];

export async function listCompareFaces() {
  const rows = await soft(
    () =>
      prisma.player.findMany({
        where: {
          OR: COMPARE_FACE_NEEDLES.map((name) => ({
            name: {
              contains: name === 'Kylian Mbappe' ? 'Mbapp' : name,
              mode: 'insensitive' as const,
            },
          })),
        },
        take: 40,
        select: {
          name: true,
          slug: true,
          photoUrl: true,
          position: true,
        },
      }),
    [],
  );

  const ranked: typeof rows = [];
  for (const needle of COMPARE_FACE_NEEDLES) {
    const hit = rows.find(
      (row) =>
        row.name.toLowerCase().includes(needle.toLowerCase()) ||
        (needle === 'Kylian Mbappe' && /mbapp/i.test(row.name)),
    );
    if (hit && !ranked.some((row) => row.slug === hit.slug)) ranked.push(hit);
  }
  return ranked.slice(0, 8);
}
