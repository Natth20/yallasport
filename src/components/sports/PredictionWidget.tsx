'use client';

import React, { useState } from 'react';
import { Trophy, CheckCircle2, Lock } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface PredictionWidgetProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  isLoggedIn: boolean;
  existingPrediction?: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';
}

/**
 * PredictionWidget - Allows users to predict match outcomes and earn points.
 */
export const PredictionWidget: React.FC<PredictionWidgetProps> = ({ 
  matchId, 
  homeTeamName, 
  awayTeamName,
  isLoggedIn,
  existingPrediction 
}) => {
  const t = useTranslations('sports');
  const [prediction, setPrediction] = useState<'HOME_WIN' | 'AWAY_WIN' | 'DRAW' | undefined>(existingPrediction);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingPrediction);

  const handlePredict = async (outcome: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW') => {
    if (!isLoggedIn) return;
    if (submitted) return;

    setPrediction(outcome);
    setSubmitting(true);

    try {
      await fetch('/api/sports/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, outcome }),
      });
      setSubmitted(true);
    } catch (e) {
      console.error('Failed to submit prediction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="px-5 py-8 text-center">
        <Lock className="mx-auto h-6 w-6 text-primary" />
        <h4 className="mt-3 text-sm font-bold text-foreground">{t('sign_in_predict')}</h4>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">{t('prediction_pitch')}</p>
      </div>
    );
  }

  return (
    <div className="relative p-5">
      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary">{t('predict')}</span>
      <h3 className="mt-1 flex items-center gap-2 text-sm font-bold text-foreground">
        <Trophy className="h-4 w-4 text-primary" />
        {t('predict_result')}
      </h3>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: homeTeamName, value: 'HOME_WIN' },
          { label: t('draw'), value: 'DRAW' },
          { label: awayTeamName, value: 'AWAY_WIN' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePredict(opt.value as 'HOME_WIN' | 'AWAY_WIN' | 'DRAW')}
            disabled={submitted || submitting}
            className={`rounded-xl border px-2 py-3 text-[10px] font-bold transition-all ${
              prediction === opt.value
                ? 'border-primary bg-primary text-white shadow-md shadow-primary/25'
                : 'border-border bg-muted text-foreground hover:border-primary/40 dark:border-border dark:bg-card/[0.04]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {submitted && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-2 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4" />
          {t('prediction_saved')}
        </div>
      )}

      {submitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 backdrop-blur-sm">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
};
