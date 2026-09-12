// src/components/home/TopPlayersWidget.tsx
import React from 'react';
import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type PlayerRow = {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  position: string | null;
};

export async function TopPlayersWidget({ players }: { players: PlayerRow[] }) {
  const t = await getTranslations('sports');
  if (players.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 dark:border-border dark:bg-card/[0.03]">
      <h4 className="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">
        <Star className="h-4 w-4 fill-current" />
        {t('top_players')}
      </h4>
      <div className="space-y-5">
        {players.map((player, index) => (
          <Link
            key={player.id}
            href={`/player/${player.slug}`}
            className="group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 overflow-hidden rounded-xl border border-border bg-muted p-0.5 dark:border-border dark:bg-black">
                <img
                  src={player.photoUrl || '/placeholder-player.svg'}
                  alt=""
                  className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
              <div>
                <span className="block text-xs font-black text-foreground transition-colors group-hover:text-orange-500 dark:text-foreground">
                  {player.name}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                  {player.position || '—'}
                </span>
              </div>
            </div>
            <div className="text-[10px] font-black tabular-nums text-muted-foreground dark:text-foreground/20">
              {index + 1}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
