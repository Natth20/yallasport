// src/components/ads/AdSlot.tsx
'use client';

import React from 'react';
import {useTranslations} from 'next-intl';

interface AdSlotProps {
  placement: 'header' | 'sidebar' | 'inline' | 'footer';
  width?: number;
  height?: number;
}

export const AdSlot: React.FC<AdSlotProps> = ({ placement, width = 728, height = 90 }) => {
  const t = useTranslations('sports');
  // In a real app, this would check if the slot is active in DB
  const isActive = true;

  if (!isActive) return null;

  return (
    <div 
      className={`bg-muted dark:bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border dark:border-border overflow-hidden mx-auto my-6 shrink-0`}
      style={{ width: `${width}px`, height: `${height}px`, minWidth: `${width}px`, minHeight: `${height}px` }}
    >
      <div className="text-center">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">{t('ad_space')}</span>
        <span className="text-[8px] text-muted-foreground">{placement} - {width}x{height}</span>
      </div>
    </div>
  );
};
