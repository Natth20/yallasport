export const STAT_BOARDS = [
  { id: '39', slug: 'premier-league', ar: 'الدوري الإنجليزي الممتاز', en: 'Premier League' },
  { id: '140', slug: 'la-liga', ar: 'الدوري الإسباني', en: 'La Liga' },
  { id: '135', slug: 'serie-a', ar: 'الدوري الإيطالي', en: 'Serie A' },
  { id: '78', slug: 'bundesliga', ar: 'الدوري الألماني', en: 'Bundesliga' },
  { id: '61', slug: 'ligue-1', ar: 'الدوري الفرنسي', en: 'Ligue 1' },
  { id: '2', slug: 'ucl', ar: 'دوري أبطال أوروبا', en: 'Champions League' },
  { id: '3', slug: 'europa-league', ar: 'الدوري الأوروبي', en: 'UEFA Europa League' },
  { id: '307', slug: 'spl', ar: 'دوري روشن السعودي', en: 'Saudi Pro League' },
  { id: '233', slug: 'epl-egypt', ar: 'الدوري المصري الممتاز', en: 'Egyptian Premier League' },
  { id: '15', slug: 'afc-cl', ar: 'دوري أبطال آسيا للنخبة', en: 'AFC Champions League Elite' },
  { id: '12', slug: 'caf-cl', ar: 'دوري أبطال أفريقيا', en: 'CAF Champions League' },
  { id: '301', slug: 'uae-pro-league', ar: 'دوري أدنوك للمحترفين', en: 'UAE Pro League' },
  { id: '305', slug: 'qatar-stars-league', ar: 'دوري نجوم قطر', en: 'Qatar Stars League' },
  { id: '200', slug: 'botola-pro', ar: 'الدوري المغربي للمحترفين', en: 'Botola Pro' },
  { id: '203', slug: 'super-lig', ar: 'الدوري التركي الممتاز', en: 'Süper Lig' },
  { id: '94', slug: 'primeira-liga', ar: 'الدوري البرتغالي', en: 'Primeira Liga' },
  { id: '88', slug: 'eredivisie', ar: 'الدوري الهولندي', en: 'Eredivisie' },
] as const;

export type StatBoard = (typeof STAT_BOARDS)[number];

export function resolveStatBoard(raw?: string | null): StatBoard {
  if (!raw) return STAT_BOARDS[0];
  return STAT_BOARDS.find((row) => row.id === raw || row.slug === raw) || STAT_BOARDS[0];
}

export function statBoardLabel(locale: string, externalId: string | null | undefined, fallback: string) {
  const board = STAT_BOARDS.find((row) => row.id === externalId);
  if (board) return locale === 'ar' ? board.ar : board.en;
  return fallback;
}

export type StatKind =
  | 'goals'
  | 'assists'
  | 'combined'
  | 'shots'
  | 'shotsOn'
  | 'keyPasses'
  | 'dribbles'
  | 'duels'
  | 'penaltiesScored'
  | 'foulsDrawn'
  | 'tackles'
  | 'interceptions'
  | 'yellow'
  | 'red'
  | 'saves'
  | 'conceded'
  | 'rating'
  | 'xg';

export type StatSort = 'value' | 'apps' | 'minutes' | 'name';

export const ALL_STAT_KINDS: StatKind[] = [
  'goals',
  'assists',
  'combined',
  'shots',
  'shotsOn',
  'keyPasses',
  'dribbles',
  'duels',
  'penaltiesScored',
  'foulsDrawn',
  'tackles',
  'interceptions',
  'yellow',
  'red',
  'saves',
  'conceded',
  'rating',
  'xg',
];

export type StatRow = {
  rank: number;
  name: string;
  slug: string | null;
  photoUrl: string | null;
  teamName: string | null;
  teamLogo: string | null;
  teamSlug: string | null;
  value: number;
  secondary: number | null;
  appearances: number | null;
  minutes: number | null;
  position: string | null;
};

export type TeamStatRow = {
  name: string;
  slug: string;
  logoUrl: string | null;
  goalsFor: number;
  goalsAgainst: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  played: number;
};

export type Desk = {
  board: StatBoard;
  season: number;
  liveSeason: number;
  previousSeason: boolean;
  rows: StatRow[];
  teamRows: TeamStatRow[];
  leagueTotals: { matches: number; goals: number; wins: number } | null;
  leagueSlug: string | null;
  fetchedAt: Date | string | null;
  seasons: number[];
  minApps: number;
};
