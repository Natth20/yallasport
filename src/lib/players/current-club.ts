import { splitTransferType, type TransferKind } from '@/lib/transfers/fee';

export type ClubRef = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  shirtNumber: number | null;
};

export type TransferHint = {
  date: Date;
  type: string | null;
  fromTeam: string | null;
  toTeam: string | null;
  fromId?: string | null;
  toId?: string | null;
  fromLogo?: string | null;
  toLogo?: string | null;
};

export type SeasonTeamHint = {
  id: string;
  name: string;
  logoUrl: string | null;
  season: number | null;
  appearances: number | null;
};

function sameClub(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Current club from live season stats and the latest recorded move — never a closed historical stint. */
export function resolveCurrentClub(input: {
  seasonTeams: SeasonTeamHint[];
  transfers: TransferHint[];
  openStints: ClubRef[];
  currentSeason: number;
}): { club: ClubRef | null; onLoanFrom: ClubRef | null; confirmedFreeAgent: boolean } {
  const seasons = input.seasonTeams.map((row) => row.season || 0).filter((value) => value > 0);
  const latestSeason = seasons.length > 0 ? Math.max(...seasons) : input.currentSeason;
  const inLatestSeason = input.seasonTeams.filter(
    (row) => row.season === latestSeason || (latestSeason === 0 && row.season == null),
  );
  const rankedSeason = [...inLatestSeason].sort(
    (a, b) => (b.appearances || 0) - (a.appearances || 0),
  );
  const latestMove = [...input.transfers]
    .filter((row) => !Number.isNaN(row.date.getTime()) && row.date.getTime() > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  const moveKind: TransferKind | null = latestMove ? splitTransferType(latestMove.type).kind : null;

  const clubFromHint = (name?: string | null, id?: string | null, logo?: string | null): ClubRef | null => {
    if (!name && !id) return null;
    const fromSeason = input.seasonTeams.find(
      (row) => (id && row.id && row.id === id) || sameClub(row.name, name),
    );
    const fromOpen = input.openStints.find(
      (row) => (id && row.id === id) || sameClub(row.name, name),
    );
    return {
      id: fromOpen?.id || fromSeason?.id || id || name || '',
      name: fromOpen?.name || fromSeason?.name || name || '',
      slug: fromOpen?.slug || '',
      logoUrl: fromOpen?.logoUrl || fromSeason?.logoUrl || logo || null,
      shirtNumber: fromOpen?.shirtNumber ?? null,
    };
  };

  if (moveKind === 'retired' || moveKind === 'ended') {
    if (!latestMove?.toTeam) {
      return { club: null, onLoanFrom: null, confirmedFreeAgent: true };
    }
  }

  let onLoanFrom: ClubRef | null = null;
  let club: ClubRef | null = null;

  if (moveKind === 'loan' && latestMove?.toTeam) {
    club = clubFromHint(latestMove.toTeam, latestMove.toId, latestMove.toLogo);
    onLoanFrom = clubFromHint(latestMove.fromTeam, latestMove.fromId, latestMove.fromLogo);
  }

  if (!club && rankedSeason[0]) {
    const top = rankedSeason[0];
    club = clubFromHint(top.name, top.id, top.logoUrl);
  }

  if (!club && moveKind === 'move' && latestMove?.toTeam) {
    club = clubFromHint(latestMove.toTeam, latestMove.toId, latestMove.toLogo);
  }

  if (!club && moveKind === 'free' && latestMove?.toTeam) {
    club = clubFromHint(latestMove.toTeam, latestMove.toId, latestMove.toLogo);
  }

  if (!club && input.openStints[0]) {
    club = input.openStints[0];
  }

  if (club && moveKind === 'loan' && latestMove?.fromTeam && !onLoanFrom) {
    onLoanFrom = clubFromHint(latestMove.fromTeam, latestMove.fromId, latestMove.fromLogo);
  }

  if (onLoanFrom && club && sameClub(onLoanFrom.name, club.name)) {
    onLoanFrom = null;
  }

  const confirmedFreeAgent = !club && (moveKind === 'ended' || moveKind === 'retired' || (moveKind === 'free' && !latestMove?.toTeam));

  return { club, onLoanFrom, confirmedFreeAgent };
}
