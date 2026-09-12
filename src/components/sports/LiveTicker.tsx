'use client';

import React from 'react';
import { NormalizedMatch } from '@/lib/sports-data/types';
import {Link} from '@/i18n/navigation';
import { useLiveStatus } from '@/lib/context/LiveStatusContext';

interface LiveTickerProps {
  matches: NormalizedMatch[];
}

/**
 * LiveTicker - Ultra-slim horizontal scrolling bar for live scores.
 * Designed to be informative but non-intrusive.
 */
export const LiveTicker: React.FC<LiveTickerProps> = ({ matches }) => {
  const { matches: streamedMatches } = useLiveStatus();
  const currentMatches = streamedMatches.length > 0 ? streamedMatches : matches;
  const liveMatches = currentMatches.filter(m => m.status === 'LIVE' || m.status === 'HALFTIME');

  if (liveMatches.length === 0) return null;

  return (
    <div className="bg-muted dark:bg-card/[0.04] overflow-hidden py-1.5 border-b border-border dark:border-border relative z-[90]" dir="ltr">
      <div className="flex animate-marquee whitespace-nowrap gap-16 items-center">
        {liveMatches.concat(liveMatches).map((match, i) => (
          <Link 
            key={`${match.id}-${i}`} 
            href={`/match/${match.id}`}
            className="flex items-center gap-6 group"
          >
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold uppercase text-orange-500 tracking-wider">Live</span>
            </div>
            
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-orange-500 transition-colors uppercase">{match.homeTeam.name}</span>
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-card dark:bg-black/20 rounded border border-border dark:border-border">
                  <span className="text-[11px] font-bold tabular-nums text-foreground dark:text-foreground">{match.homeScore}</span>
                  <span className="text-[11px] font-bold text-muted-foreground dark:text-foreground">:</span>
                  <span className="text-[11px] font-bold tabular-nums text-foreground dark:text-foreground">{match.awayScore}</span>
               </div>
               <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-orange-500 transition-colors uppercase">{match.awayTeam.name}</span>
            </div>

            <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-orange-500 tabular-nums">{match.minute}&prime;</span>
               <div className="w-4 h-[1px] bg-slate-200 dark:bg-muted/10"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
