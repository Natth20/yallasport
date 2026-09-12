import React from 'react';
import { Target } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export type HomeScorerRow = {
  goals: number;
  player: {
    id: string;
    name: string;
    slug: string;
    photoUrl: string | null;
  };
  teamName?: string;
  leagueSlug?: string;
};

export async function HomeScorersWidget({ scorers }: { scorers: HomeScorerRow[] }) {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const en = locale !== 'ar';
  if (scorers.length === 0) return null;

  return (
    <div className="salon-sheet rounded-[1.6rem] p-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h4
          className={`flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] text-[#c26a3a] ${en ? 'uppercase' : ''}`}
        >
          <Target className="h-4 w-4" />
          {t('scorers_title')}
        </h4>
        <Link
          href="/leagues"
          className="text-[11px] font-semibold text-muted-foreground hover:text-[#c26a3a]"
        >
          {t('scorers_cta')}
        </Link>
      </div>
      <div className="space-y-4">
        {scorers.map((row, index) => (
          <Link
            key={row.player.id}
            href={`/player/${row.player.slug}`}
            className="group flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span
                className={`w-5 text-[11px] font-black tabular-nums ${
                  index < 3 ? 'text-[#c26a3a]' : 'text-muted-foreground dark:text-foreground'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-card dark:bg-card/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.player.photoUrl || '/placeholder-player.svg'}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-foreground group-hover:text-[#c26a3a] dark:text-foreground">
                  {row.player.name}
                </span>
                {row.teamName ? (
                  <span className="block truncate text-[10px] text-muted-foreground">{row.teamName}</span>
                ) : null}
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-[#f7f3ee] px-3 py-1 text-xs font-black tabular-nums dark:bg-card/[0.04]">
              {row.goals}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
