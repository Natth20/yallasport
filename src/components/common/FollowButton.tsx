'use client';
import { swallow } from '@/lib/ops/caught';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface FollowButtonProps {
  entityId: string;
  entityType: 'TEAM' | 'MATCH' | 'LEAGUE';
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
  variant?: 'primary' | 'ghost';
}

export const FollowButton: React.FC<FollowButtonProps> = ({ 
  entityId, 
  entityType, 
  isLoggedIn: loggedInProp,
  initialIsFollowing,
  variant = 'ghost'
}) => {
  const t = useTranslations('sports');
  const [isLoggedIn, setIsLoggedIn] = useState(loggedInProp);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/favorite')
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 401) {
          setIsLoggedIn(false);
          return;
        }
        if (!response.ok) return;
        setIsLoggedIn(true);
        const data = await response.json();
        const list = Array.isArray(data?.favorites) ? data.favorites : [];
        setIsFollowing(
          list.some(
            (row: { entityId?: string; entityType?: string }) =>
              row.entityType === entityType && row.entityId === entityId,
          ),
        );
      })
      .catch(swallow("src/components/common/FollowButton.tsx:47", undefined));
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType]);

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

  const baseStyles = "px-6 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2.5 backdrop-blur-md border shadow-lg active:scale-95 disabled:opacity-50";
  const variants = {
    primary: isFollowing 
      ? "bg-card border-border text-foreground" 
      : "bg-primary border-primary/50 text-white shadow-primary/25 hover:bg-primary/90",
    ghost: isFollowing 
      ? "bg-primary/20 border-primary/30 text-primary" 
      : "bg-foreground/5 border-foreground/10 text-foreground hover:bg-foreground/10"
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
