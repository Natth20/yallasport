import { NextRequest, NextResponse } from 'next/server';
import { loadMapVenues } from '@/lib/venues/load-venues';
import type { MapFilterCategory } from '@/lib/venues/types';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || 'all') as MapFilterCategory;
    const query = searchParams.get('q') || '';
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const locale = searchParams.get('locale') || 'ar';

    const userLat = latStr ? parseFloat(latStr) : undefined;
    const userLng = lngStr ? parseFloat(lngStr) : undefined;

    const data = await loadMapVenues({
      category,
      query,
      userLat: Number.isFinite(userLat) ? userLat : undefined,
      userLng: Number.isFinite(userLng) ? userLng : undefined,
      locale,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[API /api/map/venues] Error loading venues:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load map venues',
        venues: [],
        stats: { totalVenues: 0, liveMatches: 0, todayMatches: 0 },
      },
      { status: 500 }
    );
  }
}
