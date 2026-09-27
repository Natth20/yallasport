'use client';

import React from 'react';
import { MetalMark } from '@/components/brand/MetalMark';

export function FootballLoader({
  caption,
  title,
}: {
  caption?: string;
  title?: string;
}) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 p-6 text-center" role="status">
      <MetalMark size="lg" />
      {(title || caption) && (
        <div className="flex flex-col items-center gap-1">
          {title && <h3 className="text-sm font-bold text-foreground">{title}</h3>}
          {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
        </div>
      )}
    </div>
  );
}
