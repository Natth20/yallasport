import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { GLOBAL_VENUES } from './catalog';
import type { MapVenue, MapFilterCategory } from './types';

// Haversine formula for calculating distance in kilometers between two GPS points
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function loadMapVenues(options: {
  category?: MapFilterCategory;
  query?: string;
  userLat?: number;
  userLng?: number;
  locale?: string;
} = {}): Promise<{
  venues: MapVenue[];
  stats: {
    totalVenues: number;
    liveMatches: number;
    todayMatches: number;
  };
}> {
  const { category = 'all', query = '', userLat, userLng } = options;

  return cachedJson(`map:venues:v2`, 60, async () => {
    // 1. Fetch today's upcoming and live matches to connect with venues
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { status: { in: ['LIVE', 'HALFTIME'] } },
          { kickoffAt: { gte: dayStart, lte: dayEnd } },
        ],
      },
      select: {
        id: true,
        status: true,
        minute: true,
        homeScore: true,
        awayScore: true,
        kickoffAt: true,
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        league: { select: { name: true } },
        venue: { select: { name: true, city: true } },
      },
      take: 50,
    }).catch(() => []);

    let liveCount = 0;
    let todayCount = 0;

    // 2. Associate matches with venues
    const venuesWithMatches: MapVenue[] = GLOBAL_VENUES.map((venue) => {
      // Find matching fixture for this stadium
      const match = matches.find((m) => {
        const homeName = m.homeTeam.name.toLowerCase();
        const venueTeam = venue.teamName.toLowerCase();
        const venueName = (venue.name + ' ' + venue.nameAr).toLowerCase();
        return (
          homeName.includes(venueTeam) ||
          venueTeam.includes(homeName) ||
          (m.venue?.name && venueName.includes(m.venue.name.toLowerCase()))
        );
      });

      let nextMatch = null;
      if (match) {
        todayCount++;
        const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
        if (isLive) liveCount++;

        nextMatch = {
          matchId: match.id,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          homeLogo: match.homeTeam.logoUrl || undefined,
          awayLogo: match.awayTeam.logoUrl || undefined,
          kickoffAt: match.kickoffAt.toISOString(),
          competition: match.league.name,
          isLive,
          homeScore: match.homeScore ?? undefined,
          awayScore: match.awayScore ?? undefined,
          minute: match.minute ?? undefined,
        };
      }

      return {
        ...venue,
        nextMatch,
      };
    });

    return {
      venues: venuesWithMatches,
      stats: {
        totalVenues: GLOBAL_VENUES.length,
        liveMatches: liveCount,
        todayMatches: todayCount,
      },
    };
  }).then(({ venues, stats }) => {
    let filtered = venues;

    // Filter by query (stadium, team, city, country)
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.nameAr.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.cityAr.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.countryAr.toLowerCase().includes(q) ||
          v.teamName.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category === 'stadium') {
      filtered = filtered.filter((v) => v.category === 'stadium');
    } else if (category === 'club') {
      filtered = filtered.filter((v) => Boolean(v.teamSlug));
    } else if (category === 'live') {
      filtered = filtered.filter((v) => v.nextMatch?.isLive);
    } else if (category === 'today') {
      filtered = filtered.filter((v) => Boolean(v.nextMatch));
    }

    // Calculate distance and sort if user coordinates provided
    if (userLat != null && userLng != null) {
      filtered = filtered.map((v) => ({
        ...v,
        distanceKm: calculateDistanceKm(userLat, userLng, v.latitude, v.longitude),
      }));

      // Sort nearest first when GPS is available
      filtered.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
    }

    return {
      venues: filtered,
      stats,
    };
  });
}
