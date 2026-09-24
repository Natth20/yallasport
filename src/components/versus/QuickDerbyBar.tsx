'use client';

import React from 'react';
import { Flame, Swords } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface DerbyOption {
  nameAr: string;
  nameEn: string;
  team1Slug: string;
  team2Slug: string;
  tag: string;
}

const POPULAR_DERBIES: DerbyOption[] = [
  {
    nameAr: 'الكلاسيكو 🇪🇸',
    nameEn: 'El Clásico 🇪🇸',
    team1Slug: 'real-madrid',
    team2Slug: 'barcelona',
    tag: 'La Liga',
  },
  {
    nameAr: 'ديربي مانشستر 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    nameEn: 'Manchester Derby 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team1Slug: 'manchester-city',
    team2Slug: 'manchester-united',
    tag: 'Premier League',
  },
  {
    nameAr: 'ديربي الرياض 🇸🇦',
    nameEn: 'Riyadh Derby 🇸🇦',
    team1Slug: 'al-hilal',
    team2Slug: 'al-nassr',
    tag: 'SPL',
  },
  {
    nameAr: 'ديربي إيطاليا 🇮🇹',
    nameEn: 'Derby d’Italia 🇮🇹',
    team1Slug: 'inter',
    team2Slug: 'juventus',
    tag: 'Serie A',
  },
  {
    nameAr: 'ديربي شمال لندن 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    nameEn: 'North London Derby 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    team1Slug: 'arsenal',
    team2Slug: 'tottenham',
    tag: 'Premier League',
  },
];

export function QuickDerbyBar({
  currentTeam1,
  currentTeam2,
  locale = 'ar',
}: {
  currentTeam1?: string;
  currentTeam2?: string;
  locale?: string;
}) {
  const isAr = locale === 'ar';

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/70 to-card/90 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 pb-3">
        <Swords className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
          {isAr ? 'أشهر الديربيات العالمية والعربية (Quick Derbies)' : 'Popular Head-to-Head Derbies'}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {POPULAR_DERBIES.map((derby) => {
          const isActive =
            (currentTeam1?.includes(derby.team1Slug) && currentTeam2?.includes(derby.team2Slug)) ||
            (currentTeam1?.includes(derby.team2Slug) && currentTeam2?.includes(derby.team1Slug));

          return (
            <Link
              key={derby.team1Slug}
              href={`/compare?team1=${derby.team1Slug}&team2=${derby.team2Slug}`}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'border border-white/10 bg-card/80 text-foreground/80 hover:border-primary/50 hover:bg-card hover:text-foreground'
              }`}
            >
              <span>{isAr ? derby.nameAr : derby.nameEn}</span>
              <span className="rounded bg-foreground/10 px-1 py-0.5 text-[9px] font-semibold text-foreground/50">
                {derby.tag}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
