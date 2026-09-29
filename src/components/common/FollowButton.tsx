'use client';
import { swallow } from '@/lib/ops/caught';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ensurePushSubscription } from '@/components/pwa/ensure-push';
import { pick } from '@/i18n/pick';

interface FollowButtonProps {
  entityId: string;
  entityType: 'TEAM' | 'MATCH' | 'LEAGUE';
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
  variant?: 'primary' | 'ghost';
  tone?: 'default' | 'stage';
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  entityId,
  entityType,
  isLoggedIn: loggedInProp,
  initialIsFollowing,
  variant = 'ghost',
  tone = 'default',
  className = '',
}) => {
  const t = useTranslations('sports');
  const locale = useLocale();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(loggedInProp);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

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
      .catch(swallow('src/components/common/FollowButton.tsx:47', undefined));
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType]);

  const toggleFollow = async () => {
    if (!isLoggedIn) {
      const callback = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
      return;
    }

    setLoading(true);
    setHint(null);
    try {
      const response = await fetch('/api/user/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, entityType, action: isFollowing ? 'REMOVE' : 'ADD' }),
      });

      if (!response.ok) {
        setHint(pick(locale, 'تعذر حفظ المتابعة. حاول مرة أخرى.', 'Could not save follow. Try again.'));
        return;
      }

      const next = !isFollowing;
      setIsFollowing(next);
      if (next) {
        try {
          await ensurePushSubscription();
        } catch {
          setHint(
            pick(
              locale,
              'المتابعة محفوظة. اسمح بالإشعارات من إعدادات المتصفح حتى تصلك التنبيهات.',
              'Follow saved. Allow notifications in the browser to receive alerts.',
            ),
          );
        }
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      setHint(pick(locale, 'تعذر حفظ المتابعة. حاول مرة أخرى.', 'Could not save follow. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const baseStyles =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all active:scale-95 disabled:opacity-60';
  const variants = {
    primary: isFollowing
      ? 'bg-card border border-border text-foreground'
      : 'bg-primary border border-primary/50 text-white hover:bg-primary/90',
    ghost: isFollowing
      ? 'bg-primary/20 border border-primary/30 text-primary'
      : 'bg-foreground/5 border border-foreground/10 text-foreground hover:bg-foreground/10',
  };

  return (
    <span className={`inline-flex max-w-full flex-col items-end gap-1 ${tone === 'stage' ? 'text-end' : ''}`}>
      <button
        type="button"
        onClick={() => void toggleFollow()}
        disabled={loading}
        data-on={isFollowing ? 'true' : 'false'}
        aria-pressed={isFollowing}
        className={`${baseStyles} ${tone === 'stage' ? '' : variants[variant]} ${className}`.trim()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {isFollowing ? t('unfollow') : t('follow')}
      </button>
      {hint ? <span className={tone === 'stage' ? 'max-w-[16rem] text-[10px] font-bold leading-snug text-white/75' : 'max-w-[16rem] text-[10px] font-bold leading-snug text-muted-foreground'}>{hint}</span> : null}
    </span>
  );
};
