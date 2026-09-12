import React from 'react';
import { Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

type StandingRow = {
  id: string;
  points: number;
  rank: number;
  team: { name: string; logoUrl: string | null };
  league: { name: string; slug: string };
};

export async function HomeStandingsWidget({ standings }: { standings: StandingRow[] }) {
  const t = await getTranslations('sports');
  if (standings.length === 0) return null;
  const league = standings[0]?.league;

  return (
    <div className="salon-sheet rounded-[1.6rem] p-7">
      <h4 className="mb-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] text-primary">
        <Trophy className="h-4 w-4" />
        {league ? league.name : t('standings')}
      </h4>
      <div className="space-y-4">
        {standings.map((row) => (
          <div key={row.id} className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-4">
               <span className={`w-5 text-[11px] font-black tabular-nums ${row.rank <= 3 ? 'text-primary' : 'text-muted-foreground dark:text-foreground'}`}>
                 {String(row.rank).padStart(2, '0')}
               </span>
               <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-card p-1.5 dark:bg-card/[0.04]">
                  <img src={row.team.logoUrl || '/placeholder.png'} alt="" className="h-full w-full object-contain" />
               </div>
               <span className="truncate text-xs font-bold text-foreground dark:text-foreground">{row.team.name}</span>
            </div>
            <span className="rounded-lg bg-muted px-3 py-1 text-xs font-black tabular-nums dark:bg-card/[0.04]">{row.points}</span>
          </div>
        ))}
      </div>
      {league && (
        <Link href={`/league/${league.slug}/standings`} className="mt-6 inline-block text-[11px] font-semibold text-primary">
          {t('standings')}
        </Link>
      )}
    </div>
  );
}
