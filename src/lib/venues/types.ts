export interface MapVenue {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  country: string;
  countryAr: string;
  countryCode: string;
  capacity: number;
  openedYear: number;
  surface: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  teamName: string;
  teamSlug?: string;
  teamLogo?: string;
  category: 'stadium' | 'club' | 'fan_zone' | 'academy';
  nextMatch?: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    homeLogo?: string;
    awayLogo?: string;
    kickoffAt: string;
    competition: string;
    isLive?: boolean;
    homeScore?: number;
    awayScore?: number;
    minute?: number;
  } | null;
  distanceKm?: number;
}

export type MapFilterCategory = 'all' | 'stadium' | 'club' | 'live' | 'today' | 'fan_zone';
