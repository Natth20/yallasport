'use client';

import React from 'react';
import { Flame, Shield, TrendingUp } from 'lucide-react';
import { useLocale } from 'next-intl';

interface AttackMomentumProps {
  homeName: string;
  awayName: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homePossession?: number | null;
  awayPossession?: number | null;
  homeShotsOnTarget?: number | null;
  awayShotsOnTarget?: number | null;
  isLive?: boolean;
}

export function AttackMomentumGauge({
  homeName,
  awayName,
  homeScore = 0,
  awayScore = 0,
  homePossession = 50,
  awayPossession = 50,
  homeShotsOnTarget = 0,
  awayShotsOnTarget = 0,
  isLive = false,
}: AttackMomentumProps) {
  const locale = useLocale();
  const ar = locale === 'ar';

  // Calculate weighted momentum index (0 to 100)
  const posDiff = (homePossession || 50) - (awayPossession || 50);
  const shotDiff = ((homeShotsOnTarget || 0) - (awayShotsOnTarget || 0)) * 6;
  const scoreDiff = ((homeScore || 0) - (awayScore || 0)) * 8;

  const rawMomentum = 50 + posDiff * 0.4 + shotDiff + scoreDiff;
  const homePercent = Math.round(Math.max(15, Math.min(85, rawMomentum)));
  const awayPercent = 100 - homePercent;

  const leader =
    homePercent === 50
      ? null
      : homePercent > 50
        ? homeName
        : awayName;

  return (
    <div
      style={{
        borderRadius: '1.25rem',
        padding: '1.25rem',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Flame
            style={{
              width: '1.1rem',
              height: '1.1rem',
              color: '#f97316',
              animation: isLive ? 'pulse 1.5s infinite' : undefined,
            }}
          />
          <h4
            style={{
              margin: 0,
              fontSize: '0.85rem',
              fontWeight: 900,
              color: 'var(--foreground, #ffffff)',
              letterSpacing: '-0.01em',
            }}
          >
            {ar ? 'مؤشر الزخم الهجومي والضغط' : 'Attack & Pressure Momentum'}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isLive ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 900,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span
                style={{
                  width: '0.35rem',
                  height: '0.35rem',
                  borderRadius: '999px',
                  backgroundColor: '#ef4444',
                }}
              />
              {ar ? 'مباشر' : 'LIVE'}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.7rem',
                color: '#94a3b8',
                fontWeight: 700,
              }}
            >
              {ar ? 'الضغط الميداني' : 'Field Pressure'}
            </span>
          )}
        </div>
      </div>

      {/* Teams Label & Percentages */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          fontWeight: 800,
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
          <span>{homeName}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>{homePercent}%</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3b82f6' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>{awayPercent}%</span>
          <span>{awayName}</span>
        </div>
      </div>

      {/* Duel Momentum Bar */}
      <div
        style={{
          position: 'relative',
          height: '0.75rem',
          borderRadius: '999px',
          background: 'rgba(30, 41, 59, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            width: `${homePercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #059669, #10b981)',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
          }}
        />
        <div
          style={{
            width: `${awayPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
          }}
        />
      </div>

      {/* Insight Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.65rem',
          fontSize: '0.72rem',
          color: '#94a3b8',
          fontWeight: 600,
        }}
      >
        <span>
          {leader
            ? (ar ? `الأفضلية الهجومية الحالية لصالح ${leader}` : `Attacking momentum favors ${leader}`)
            : (ar ? 'توازن تكتيكي متكافئ بين الفريقين' : 'Balanced tactical pressure')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: 800 }}>
          <TrendingUp style={{ width: '0.75rem', height: '0.75rem' }} />
          {ar ? 'تحديث تلقائي' : 'Real-time'}
        </span>
      </div>
    </div>
  );
}
