'use client';

import React from 'react';

export type FormResult = 'W' | 'D' | 'L';

interface FormGuidePillsProps {
  form: Array<FormResult | string>;
  size?: 'sm' | 'md';
  locale?: string;
}

export function FormGuidePills({ form = [], size = 'md', locale = 'ar' }: FormGuidePillsProps) {
  const isAr = locale === 'ar';
  const lastFive = form.slice(-5);

  const getLabel = (result: string) => {
    if (result === 'W') return isAr ? 'فوز' : 'Win';
    if (result === 'D') return isAr ? 'تعادل' : 'Draw';
    return isAr ? 'خسارة' : 'Loss';
  };

  const getClasses = (result: string) => {
    if (result === 'W') return 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
    if (result === 'D') return 'bg-amber-500/80 text-white shadow-sm shadow-amber-500/20';
    return 'bg-red-500 text-white shadow-sm shadow-red-500/20';
  };

  const dimClass = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';

  return (
    <div className="flex items-center gap-1">
      {lastFive.map((res, index) => {
        const r = (res || 'D').toUpperCase();
        return (
          <span
            key={index}
            title={getLabel(r)}
            className={`flex items-center justify-center rounded-full font-black select-none ${dimClass} ${getClasses(r)}`}
          >
            {isAr ? (r === 'W' ? 'ف' : r === 'D' ? 'ت' : 'خ') : r}
          </span>
        );
      })}
    </div>
  );
}
