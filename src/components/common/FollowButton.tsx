'use client';

import React, { useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface FollowButtonProps {
  entityId: string;
  entityType: 'TEAM' | 'MATCH' | 'LEAGUE';
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
  variant?: 'primary' | 'ghost';
}

/**
 * FollowButton - Generic component for following/favoriting teams, matches, or leagues.
 */
export const FollowButton: React.FC<FollowButtonProps> = ({ 
  entityId, 
  entityType, 
  isLoggedIn, 
  initialIsFollowing,
  variant = 'ghost'
}) => {
  const t = useTranslations('sports');
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    if (!isLoggedIn) {
      window.location.href = '/api/auth/signin';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, entityType, action: isFollowing ? 'REMOVE' : 'ADD' }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseStyles = "px-8 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-3 backdrop-blur-md border shadow-lg active:scale-95 disabled:opacity-50";
  const variants = {
    primary: isFollowing 
      ? "bg-background border-border text-white" 
      : "bg-orange-500 border-orange-400 text-primary-foreground shadow-orange-500/20",
    ghost: isFollowing 
      ? "bg-white/20 border-white/20 text-white" 
      : "bg-white/10 border-white/10 text-white hover:bg-white/20"
  };

  return (
    <button 
      onClick={toggleFollow}
      disabled={loading}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        isFollowing ? <BellOff className="w-4 h-4 text-orange-400" /> : <Bell className="w-4 h-4 text-orange-400" />
      )}
      {isFollowing ? t('unfollow') : t('follow')}
    </button>
  );
};
