'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getGoalAudioEnabled, setGoalAudioEnabled, playGoalSound } from '@/lib/audio/goal-alert';
import { useLocale } from 'next-intl';

export function GoalSoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const locale = useLocale();
  const ar = locale === 'ar';

  useEffect(() => {
    setEnabled(getGoalAudioEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setGoalAudioEnabled(next);
    if (next) {
      // Play a quick chime to confirm activation
      playGoalSound();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border ${
        enabled
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25'
          : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted'
      }`}
      title={
        enabled
          ? (ar ? 'صوت الأهداف مفعل (انقر للكتم)' : 'Goal sound alerts active (click to mute)')
          : (ar ? 'تفعيل صوت الأهداف المباشرة' : 'Enable live goal sound alerts')
      }
      aria-label={enabled ? 'Mute goal sound alerts' : 'Enable goal sound alerts'}
    >
      {enabled ? (
        <>
          <Volume2 className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="absolute -top-1 -end-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        </>
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
    </button>
  );
}
