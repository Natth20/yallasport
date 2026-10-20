'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { RefreshCw, Radio, BellRing, X } from 'lucide-react';
import styles from './live-sync-dock.module.css';

interface GoalAlert {
  id: string;
  matchId: string;
  title: string;
  minute: number | string;
  score: string;
  timestamp: number;
}

interface FrontLiveSyncDockProps {
  locale: string;
}

export function FrontLiveSyncDock({ locale }: FrontLiveSyncDockProps) {
  const ar = locale === 'ar';
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [alerts, setAlerts] = useState<GoalAlert[]>([]);
  const previousScoresRef = useRef<Map<string, string>>(new Map());

  // Elapsed timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - lastRefreshedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefreshedAt]);

  // Refresh router handler
  const handleManualRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setLastRefreshedAt(new Date());
      setElapsedSeconds(0);
      setIsRefreshing(false);
    }, 600);
  }, [isRefreshing, router]);

  // Live polling for live matches & goal events
  useEffect(() => {
    let isMounted = true;

    async function checkLiveUpdates() {
      try {
        const res = await fetch('/api/sports/live', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const matches: Array<{
          id: string;
          homeTeam: { name: string };
          awayTeam: { name: string };
          homeScore: number | null;
          awayScore: number | null;
          minute: number | null;
          status: string;
        }> = data.matches || [];

        const newAlerts: GoalAlert[] = [];

        for (const match of matches) {
          const currentScore = `${match.homeScore ?? 0}-${match.awayScore ?? 0}`;
          const prevScore = previousScoresRef.current.get(match.id);

          if (prevScore && prevScore !== currentScore) {
            // A goal occurred!
            newAlerts.push({
              id: `${match.id}-${Date.now()}`,
              matchId: match.id,
              title: `${match.homeTeam.name} ${match.homeScore ?? 0} : ${match.awayScore ?? 0} ${match.awayTeam.name}`,
              minute: match.minute ? `${match.minute}′` : (ar ? 'الآن' : 'Now'),
              score: currentScore,
              timestamp: Date.now(),
            });
          }

          previousScoresRef.current.set(match.id, currentScore);
        }

        if (isMounted && newAlerts.length > 0) {
          setAlerts((prev) => [...newAlerts, ...prev].slice(0, 3));
          router.refresh();
        }
      } catch {
        // Silently continue
      }
    }

    // Run poll every 25 seconds
    const interval = setInterval(checkLiveUpdates, 25000);
    void checkLiveUpdates();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ar, router]);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const formattedTimeAgo =
    elapsedSeconds < 5
      ? ar ? 'الآن' : 'Just now'
      : ar
      ? `منذ ${elapsedSeconds}ث`
      : `${elapsedSeconds}s ago`;

  return (
    <>
      {/* 🚀 1. The Floating Luxury Live Bar */}
      <div className={styles.syncDock} aria-label={ar ? 'شريط التحديث المباشر' : 'Live Sync Dock'}>
        <div className={styles.dockGlow} />

        {/* Live Status Badge */}
        <div className={styles.statusCluster}>
          <span className={styles.liveIndicatorRing}>
            <span className={styles.liveCoreDot} />
          </span>
          <span className={styles.statusLabel}>
            {ar ? 'مباشر' : 'LIVE'}
          </span>
        </div>

        {/* Separator */}
        <span className={styles.dockDivider} />

        {/* Time Ago Indicator */}
        <span className={styles.timeAgoText} title={ar ? 'وقت آخر تحديث تلقائي' : 'Last update time'}>
          {formattedTimeAgo}
        </span>

        {/* Refresh Action Button */}
        <button
          type="button"
          onClick={handleManualRefresh}
          className={`${styles.refreshActionBtn} ${isRefreshing ? styles.refreshRotating : ''}`}
          title={ar ? 'تحديث البيانات فورياً' : 'Instant Refresh'}
          aria-label={ar ? 'تحديث البيانات فورياً' : 'Instant Refresh'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className={styles.refreshBtnText}>{ar ? 'تحديث' : 'Update'}</span>
        </button>
      </div>

      {/* ⚽ 2. Goal Toast Alerts Container */}
      {alerts.length > 0 ? (
        <div className={styles.goalAlertsContainer} role="alert" aria-live="polite">
          {alerts.map((alert) => (
            <div key={alert.id} className={styles.goalToast}>
              <div className={styles.goalToastLeft}>
                <span className={styles.goalBallBadge}>⚽</span>
                <div>
                  <div className={styles.goalAlertHeading}>
                    <span>{ar ? 'هدف جديد في المباراة!' : 'GOAL Alert!'}</span>
                    <span className={styles.goalMinuteTag}>{alert.minute}</span>
                  </div>
                  <strong className={styles.goalMatchText}>{alert.title}</strong>
                </div>
              </div>
              <div className={styles.goalToastActions}>
                <button
                  type="button"
                  onClick={() => router.push(`/match/${alert.matchId}`)}
                  className={styles.goalMatchBtn}
                >
                  {ar ? 'مركز المباراة' : 'Match'}
                </button>
                <button
                  type="button"
                  onClick={() => dismissAlert(alert.id)}
                  className={styles.dismissBtn}
                  aria-label={ar ? 'إغلاق التنبيه' : 'Dismiss'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
