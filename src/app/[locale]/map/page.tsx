import React from 'react';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { pageMetadata, SITE_URL } from '@/lib/seo/site';
import { loadMapVenues } from '@/lib/venues/load-venues';
import YallaMapCanvas from '@/components/map/YallaMapCanvas';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === 'ar';

  return pageMetadata({
    locale,
    title: isAr
      ? 'خريطة يلا سبورت التفاعلية | الملاعب العالمية والعربية ومباريات اليوم'
      : 'Yalla Sport Interactive Map | Global & Arab Stadiums & Live Fixtures',
    description: isAr
      ? 'استكشف ملاعب كرة القدم العالمية والعربية على خريطة تفاعلية بتقنية الأقمار الصناعية وGPS، مع رادار للمباريات المباشرة ومسارات الملاحة الدقيقة.'
      : 'Explore world and Arab football stadiums on an interactive satellite and GPS map, with live match radars and instant turn-by-turn navigation.',
    path: '/map',
  });
}

export default async function MapPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const { venues, stats } = await loadMapVenues({ locale });

  // Schema.org structured data for SportsActivityLocations
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isAr ? 'خريطة ملاعب يلا سبورت' : 'Yalla Sport Stadiums Map',
    itemListElement: venues.slice(0, 15).map((venue, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'StadiumOrArena',
        name: isAr ? venue.nameAr : venue.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: venue.city,
          addressCountry: venue.countryCode,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: venue.latitude,
          longitude: venue.longitude,
        },
        image: venue.imageUrl,
        maximumAttendeeCapacity: venue.capacity,
      },
    })),
  };

  return (
    <main className="relative w-full min-h-[calc(100vh-4rem)] bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <YallaMapCanvas
        initialVenues={venues}
        initialStats={stats}
        locale={locale}
      />
    </main>
  );
}
