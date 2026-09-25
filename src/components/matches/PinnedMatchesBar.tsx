'use client';
import { reportCaughtError } from '@/lib/ops/caught';

import React, { useState, useEffect } from 'react';
import {Star, X} from 'lucide-react';
import { Link } from '@/i18n/navigation';

export interface PinnedMatchData {
  id: string;
  homeTeam: { name: string; logoUrl?: string | null };
  awayTeam: { name: string; logoUrl?: string | null };
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  minute?: number | null;
  kickoffTime?: string;
  leagueName?: string;
}

const PINNED_STORAGE_KEY = 'ys_pinned_matches';

export function getPinnedMatchIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    reportCaughtError("src/components/matches/PinnedMatchesBar.tsx:26", error, { persist: false });
    return [];
  }
}

export function togglePinMatch(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getPinnedMatchIds();
    const exists = current.includes(id);
    const updated = exists ? current.filter((m) => m !== id) : [...current, id];
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ys_pins_changed', { detail: updated }));
    return !exists;
  } catch (error) {
    reportCaughtError("src/components/matches/PinnedMatchesBar.tsx:40", error, { persist: false });
    return false;
  }
}

export function MatchPinButton({ matchId, className = '' }: { matchId: string; className?: string }) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const check = () => {
      const pins = getPinnedMatchIds();
      setIsPinned(pins.includes(matchId));
    };
    check();
    window.addEventListener('ys_pins_changed', check);
    return () => window.removeEventListener('ys_pins_changed', check);
  }, [matchId]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePinMatch(matchId);
      }}
      title={isPinned ? 'إلغاء التثبيت' : 'تثبيت في القمة'}
      className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
        isPinned
          ? 'bg-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/10'
          : 'text-foreground/35 hover:bg-foreground/5 hover:text-foreground/80'
      } ${className}`}
    >
      <Star className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
    </button>
  );
}

export function PinnedMatchesBar({
  allMatches,
  locale = 'ar',
}: {
  allMatches: PinnedMatchData[];
  locale?: string;
}) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPinnedIds(getPinnedMatchIds());

    const onPinsChange = (e: any) => {
      setPinnedIds(e.detail || getPinnedMatchIds());
    };

    window.addEventListener('ys_pins_changed', onPinsChange);
    return () => window.removeEventListener('ys_pins_changed', onPinsChange);
  }, []);

  if (!mounted) return null;

  const pinnedMatches = allMatches.filter((m) => pinnedIds.includes(m.id));
  if (pinnedMatches.length === 0) return null;

  const isAr = locale === 'ar';

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
          </span>
          <h3 className="text-sm font-black text-foreground">
            {isAr ? 'المباريات المثبتة في القمة' : 'Pinned Matches'}
          </h3>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400">
            {pinnedMatches.length}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-foreground/50">
          {isAr ? 'متابعة مباشرة سريعة' : 'Quick Live Tracker'}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {pinnedMatches.map((match) => {
          const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
          return (
            <div
              key={match.id}
              className="group relative flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-card/70 p-3 transition-all hover:border-amber-500/40 hover:bg-card/90"
            >
              <Link href={`/match/${match.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    {match.homeTeam.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={match.homeTeam.logoUrl}
                        alt=""
                        className="h-4 w-4 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-foreground/10" />
                    )}
                    <span className="truncate text-xs font-bold text-foreground">
                      {match.homeTeam.name}
                    </span>
                    <span className="ms-auto text-xs font-black tabular-nums">
                      {match.homeScore ?? '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {match.awayTeam.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={match.awayTeam.logoUrl}
                        alt=""
                        className="h-4 w-4 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-foreground/10" />
                    )}
                    <span className="truncate text-xs font-bold text-foreground">
                      {match.awayTeam.name}
                    </span>
                    <span className="ms-auto text-xs font-black tabular-nums">
                      {match.awayScore ?? '-'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 ps-2">
                  {isLive ? (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {match.minute ? `${match.minute}'` : isAr ? 'مباشر' : 'LIVE'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-foreground/45">
                      {match.kickoffTime || (match.status === 'FINISHED' ? (isAr ? 'انتهت' : 'FT') : '--:--')}
                    </span>
                  )}
                  {match.leagueName ? (
                    <span className="truncate max-w-[80px] text-[9px] text-foreground/40">
                      {match.leagueName}
                    </span>
                  ) : null}
                </div>
              </Link>

              <button
                type="button"
                onClick={() => togglePinMatch(match.id)}
                title={isAr ? 'إزالة التثبيت' : 'Unpin'}
                className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/30 hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
