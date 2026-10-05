import { getLocale } from 'next-intl/server';
import { loadFrontTables } from '@/lib/front/load-tables';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMajorLeaguesClient } from './FrontMajorLeaguesClient';

const ORDER = ['2', '39', '140', '307', '135', '78'];
const DESK_BY_LEAGUE: Record<string, string> = {
  '2': 'Champions League',
  '39': 'Premier League',
  '140': 'La Liga',
  '307': 'Saudi League',
  '135': 'Serie A',
  '78': 'Bundesliga',
};

export async function FrontMajorLeagues() {
  const locale = await getLocale();
  const [tables, board, stories] = await Promise.all([
    loadFrontTables(locale),
    loadFrontBoard(locale),
    loadFrontStories(locale),
  ]);

  const leagues = ORDER.map((id) => tables.find((table) => table.league.externalId === id))
    .filter((table): table is NonNullable<typeof table> => Boolean(table))
    .slice(0, 6)
    .map((table) => {
      const match =
        board.find((row) => row.league.slug === table.league.slug) ||
        board.find((row) => row.league.name === table.league.name);
      const desk = DESK_BY_LEAGUE[table.league.externalId || ''];
      const news = [stories.lead, ...stories.rest, ...stories.latest]
        .filter((story): story is NonNullable<typeof story> => Boolean(story))
        .filter((story) => (desk ? story.category === desk : false) || story.title.includes(table.league.name))
        .slice(0, 4);
      return {
        id: table.league.id,
        name: table.league.name,
        slug: table.league.slug,
        logoUrl: table.league.logoUrl,
        standings: table.rows.slice(0, 5).map((row) => ({
          rank: row.rank,
          team: row.team.name,
          logoUrl: row.team.logoUrl,
          played: row.played,
          points: row.points,
        })),
        match: match
          ? {
              id: match.id,
              home: match.homeTeam.name,
              away: match.awayTeam.name,
              kickoffAt: match.kickoffAt,
              score:
                match.status === 'FINISHED' || match.status === 'LIVE' || match.status === 'HALFTIME'
                  ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                  : null,
            }
          : null,
        news: (news.length > 0 ? news : stories.rest.slice(0, 4)).map((story) => ({
          slug: story.slug,
          title: story.title,
          publishedAt: story.publishedAt,
        })),
      };
    });

  if (leagues.length === 0) return null;
  return <FrontMajorLeaguesClient locale={locale} leagues={leagues} />;
}
