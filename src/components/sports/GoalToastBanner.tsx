'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

export interface GoalEventDetail {
  matchId: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  minute?: number | null;
}

let notifyGoalListeners: ((goal: GoalEventDetail) => void) | null = null;

export function triggerGoalToast(goal: GoalEventDetail) {
  if (notifyGoalListeners) {
    notifyGoalListeners(goal);
  }
}

export function GoalToastBanner() {
  const [activeGoal, setActiveGoal] = useState<GoalEventDetail | null>(null);
  const locale = useLocale();
  const ar = locale === 'ar';

  useEffect(() => {
    notifyGoalListeners = (goal) => {
      setActiveGoal(goal);
    };

    return () => {
      notifyGoalListeners = null;
    };
  }, []);

  useEffect(() => {
    if (!activeGoal) return;
    const timer = setTimeout(() => {
      setActiveGoal(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeGoal]);

  if (!activeGoal) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '90%',
        maxWidth: '460px',
        animation: 'slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(245, 158, 11, 0.5)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.3)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            ⚽
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#fbbf24',
                  background: 'rgba(245, 158, 11, 0.15)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Zap style={{ width: '0.65rem', height: '0.65rem' }} />
                {ar ? 'هدف جديد الآن!' : 'NEW GOAL!'}
              </span>
              {activeGoal.minute != null ? (
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
                  {activeGoal.minute}′
                </span>
              ) : null}
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{activeGoal.homeName}</span>{' '}
              <span style={{ color: '#22c55e', margin: '0 0.3rem', fontWeight: 900 }}>
                {activeGoal.homeScore} - {activeGoal.awayScore}
              </span>{' '}
              <span>{activeGoal.awayName}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <Link
            href={`/match/${activeGoal.matchId}`}
            onClick={() => setActiveGoal(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.4rem 0.65rem',
              borderRadius: '0.75rem',
              background: '#f97316',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <span>{ar ? 'تفاصيل' : 'Match'}</span>
            {ar ? (
              <ChevronLeft style={{ width: '0.9rem', height: '0.9rem' }} />
            ) : (
              <ChevronRight style={{ width: '0.9rem', height: '0.9rem' }} />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setActiveGoal(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.8rem',
              height: '1.8rem',
              borderRadius: '999px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            aria-label="Close goal toast"
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
