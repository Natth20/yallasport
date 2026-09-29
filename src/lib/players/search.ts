import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { localizePlainName, sourceSearchQuery } from '@/lib/i18n/sports-lexicon';

export type PlayerSearchHit = {
  name: string;
  slug: string;
  photoUrl: string | null;
  teamName: string | null;
};

type ApiPlayerSearch = {
  response?: Array<{
    player?: { id?: number; name?: string; photo?: string };
    statistics?: Array<{ team?: { name?: string } }>;
  }>;
};

export function playerSlugFor(name: string, externalId: string) {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'player';
  return `${base}-${externalId}`;
}

function rankScore(name: string, slug: string, query: string) {
  const n = name.toLowerCase();
  const s = slug.replace(/-\d+$/, '').replace(/-/g, ' ');
  const q = query.toLowerCase();
  if (n === q || s === q) return 0;
  const lastName = (s.split(/\s+/).pop() || '');
  if (lastName === q) return 1;
  if (n.endsWith(` ${q}`) || s.endsWith(` ${q}`)) return 2;
  if (s.startsWith(q) || n.startsWith(q)) return 3;
  if (s.includes(q) || n.includes(q)) return 4;
  return 6;
}

const memo = new Map<string, { at: number; hits: PlayerSearchHit[] }>();

async function fromLedger(q: string, locale: string): Promise<PlayerSearchHit[]> {
  const slugBit = q.toLowerCase().replace(/\s+/g, '-');
  const rows = await prisma.player.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { officialName: { contains: q, mode: 'insensitive' } },
        { slug: { contains: slugBit, mode: 'insensitive' } },
      ],
    },
    take: 12,
    select: {
      name: true,
      slug: true,
      photoUrl: true,
    },
  });
  return rows.map((row) => ({
    name: localizePlainName(locale, row.name),
    slug: row.slug,
    photoUrl: row.photoUrl,
    teamName: null,
  }));
}

async function rememberPlayers(
  hits: Array<{ externalId: string; name: string; photoUrl: string | null }>,
) {
  if (hits.length === 0) return;
  void Promise.all(
    hits.map((hit) =>
      prisma.player
        .create({
          data: {
            externalId: hit.externalId,
            name: hit.name,
            slug: playerSlugFor(hit.name, hit.externalId),
            photoUrl: hit.photoUrl,
          },
        })
        .catch(async () => {
          const row = await prisma.player.findUnique({
            where: { externalId: hit.externalId },
            select: { id: true, photoUrl: true },
          });
          if (row && !row.photoUrl && hit.photoUrl) {
            await prisma.player.update({ where: { id: row.id }, data: { photoUrl: hit.photoUrl } }).catch(() => null);
          }
        }),
    ),
  );
}

async function fromSource(q: string, locale: string): Promise<PlayerSearchHit[]> {
  if (q.length < 3) return [];
  const season = currentFootballSeason();
  let pack = await sportsData.getRaw<ApiPlayerSearch>(
    `/players?search=${encodeURIComponent(q)}&season=${season}`,
  );
  if (!pack?.response?.length) {
    pack = await sportsData.getRaw<ApiPlayerSearch>(`/players?search=${encodeURIComponent(q)}`);
  }
  const seen = new Set<string>();
  const hits: Array<{ externalId: string; name: string; photoUrl: string | null; teamName: string | null }> = [];
  for (const row of pack?.response || []) {
    const id = row.player?.id != null ? String(row.player.id) : '';
    const name = row.player?.name?.trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    hits.push({
      externalId: id,
      name,
      photoUrl: row.player?.photo || null,
      teamName: row.statistics?.[0]?.team?.name || null,
    });
    if (hits.length >= 12) break;
  }
  if (hits.length === 0) return [];

  const existing = await prisma.player.findMany({
    where: { externalId: { in: hits.map((hit) => hit.externalId) } },
    select: { externalId: true, slug: true, photoUrl: true, name: true },
  });
  const byExt = new Map(existing.map((row) => [row.externalId, row]));
  const missing = hits.filter((hit) => !byExt.has(hit.externalId));
  rememberPlayers(missing);

  return hits.map((hit) => {
    const row = byExt.get(hit.externalId);
    return {
      name: localizePlainName(locale, row?.name || hit.name),
      slug: row?.slug || playerSlugFor(hit.name, hit.externalId),
      photoUrl: row?.photoUrl || hit.photoUrl,
      teamName: hit.teamName ? localizePlainName(locale, hit.teamName) : null,
    };
  });
}

function mergeHits(query: string, batches: PlayerSearchHit[][]): PlayerSearchHit[] {
  const seen = new Set<string>();
  const out: PlayerSearchHit[] = [];
  for (const batch of batches) {
    for (const row of batch) {
      if (seen.has(row.slug)) continue;
      seen.add(row.slug);
      out.push(row);
    }
  }
  return out.sort((a, b) => rankScore(a.name, a.slug, query) - rankScore(b.name, b.slug, query) || a.name.localeCompare(b.name)).slice(0, 12);
}

export async function searchPlayers(q: string, locale: string): Promise<PlayerSearchHit[]> {
  const query = q.trim().slice(0, 80);
  if (query.length < 2) return [];
  const memoKey = `${locale}:${query.toLowerCase()}`;
  const cached = memo.get(memoKey);
  if (cached && Date.now() - cached.at < 45_000) return cached.hits;

  const latin = sourceSearchQuery(query);
  const mapped = latin !== query;
  const sourceQuery = latin.length >= 3 ? latin : query;
  const [ledgerNative, ledgerLatin] = await Promise.all([
    fromLedger(query, locale),
    mapped ? fromLedger(latin, locale) : Promise.resolve([]),
  ]);
  const desk = mergeHits(latin || query, mapped ? [ledgerLatin, ledgerNative] : [ledgerNative]);
  const hits =
    desk.length > 0
      ? desk
      : mergeHits(
        latin || query,
        mapped
          ? [await fromSource(sourceQuery, locale), ledgerLatin, ledgerNative]
          : [await fromSource(sourceQuery, locale), ledgerNative],
      );
  memo.set(memoKey, { at: Date.now(), hits });
  if (memo.size > 80) {
    const first = memo.keys().next().value;
    if (first) memo.delete(first);
  }
  return hits;
}
