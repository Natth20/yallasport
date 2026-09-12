'use client';

import React, { useState } from 'react';
import { Bell, BellOff, Loader2, Star } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface LeagueFollowChipProps {
  leagueId: string;
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
  variant?: 'row' | 'hero' | 'soft';
  callbackUrl?: string;
}

export function LeagueFollowChip({
  leagueId,
  isLoggedIn,
  initialIsFollowing,
  variant = 'row',
  callbackUrl = '/leagues',
}: LeagueFollowChipProps) {
  const t = useTranslations('sports');
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: leagueId,
          entityType: 'LEAGUE',
          action: isFollowing ? 'REMOVE' : 'ADD',
        }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('League follow failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={toggleFollow}
        disabled={loading}
        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-[10px] font-bold transition-all disabled:opacity-60 ${
          isFollowing
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
            : 'border-white/10 bg-transparent text-white/70 hover:border-orange-400/40 hover:text-white'
        }`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isFollowing ? (
          <BellOff className="h-3.5 w-3.5 text-orange-400" />
        ) : (
          <Bell className="h-3.5 w-3.5 text-orange-400" />
        )}
        {isFollowing ? t('following') : t('follow_league')}
      </button>
    );
  }

  if (variant === 'soft') {
    return (
      <button
        type="button"
        onClick={toggleFollow}
        disabled={loading}
        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-[10px] font-bold transition-all disabled:opacity-60 ${
          isFollowing
            ? 'border-orange-500/25 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
            : 'border-border bg-card text-foreground hover:border-orange-500/30 hover:text-orange-500 dark:border-border dark:bg-card/[0.04] dark:text-muted-foreground'
        }`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isFollowing ? (
          <BellOff className="h-3.5 w-3.5" />
        ) : (
          <Bell className="h-3.5 w-3.5" />
        )}
        {isFollowing ? t('following') : t('follow_league')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      aria-label={isFollowing ? t('unfollow_league') : t('follow_league')}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all disabled:opacity-60 ${
        isFollowing
          ? 'border-orange-500/30 bg-orange-50 text-orange-500 dark:bg-orange-500/10'
          : 'border-border bg-muted text-muted-foreground hover:border-orange-500/30 hover:text-orange-500 dark:border-border dark:bg-card/[0.04]'
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isFollowing ? (
        <Star className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
