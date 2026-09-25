'use client';

import React, { useState } from 'react';
import {Trophy, CheckCircle2, Lock} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from '@/components/sports/match-dossier.module.css';

export interface PredictionWidgetProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  isLoggedIn: boolean;
  existingPrediction?: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';
}

export const PredictionWidget: React.FC<PredictionWidgetProps> = ({
  matchId,
  homeTeamName,
  awayTeamName,
  isLoggedIn,
  existingPrediction,
}) => {
  const t = useTranslations('sports');
  const [prediction, setPrediction] = useState<'HOME_WIN' | 'AWAY_WIN' | 'DRAW' | undefined>(existingPrediction);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingPrediction);

  const handlePredict = async (outcome: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW') => {
    if (!isLoggedIn || submitted || submitting) return;

    setPrediction(outcome);
    setSubmitting(true);

    try {
      const res = await fetch('/api/sports/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, outcome }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // silently handle
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.panelCard}>
        <div className="py-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ys-orange)]/15 text-[var(--ys-orange)]">
            <Lock className="h-5 w-5" />
          </div>
          <h4 className="mt-3 text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
            {t('sign_in_predict')}
          </h4>
          <p className="mt-1 text-[11px] font-medium text-[var(--muted-foreground)]">
            {t('prediction_pitch')}
          </p>
          <Link
            href="/login"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
          >
            {t('sign_in_predict')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.predictionBox}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[var(--ys-orange)]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
              {t('predict_result')}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[var(--ys-orange)]">
            +50 {t('points') || 'pts'}
          </span>
        </div>

        <div className={styles.predictionGrid}>
          {[
            { label: homeTeamName, value: 'HOME_WIN' },
            { label: t('draw'), value: 'DRAW' },
            { label: awayTeamName, value: 'AWAY_WIN' },
          ].map((opt) => {
            const isSelected = prediction === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handlePredict(opt.value as 'HOME_WIN' | 'AWAY_WIN' | 'DRAW')}
                disabled={submitted || submitting}
                className={isSelected ? styles.predictionBtnActive : styles.predictionBtn}
              >
                <span className="truncate max-w-full font-bold">{opt.label}</span>
                <span className="text-[9px] opacity-75 font-normal">
                  {opt.value === 'DRAW' ? t('draw') : opt.value === 'HOME_WIN' ? '1' : '2'}
                </span>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center text-[11px] font-bold text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t('prediction_saved')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
