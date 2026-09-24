'use client';
import { swallow } from '@/lib/ops/caught';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function BroadcastsLink({
  className,
  label,
  showLabel,
  onNavigate,
}: {
  className: string;
  label: string;
  showLabel?: boolean;
  onNavigate?: () => void;
}) {
  const [onAir, setOnAir] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const inflight = (globalThis as { __ysOnAir?: Promise<boolean> }).__ysOnAir
      ?? fetch('/api/stream/availability')
        .then((response) => response.json())
        .then((data) => Array.isArray(data?.items) && data.items.length > 0)
        .catch(swallow("src/components/layout/BroadcastsLink.tsx:26", false));
    (globalThis as { __ysOnAir?: Promise<boolean> }).__ysOnAir = inflight;
    inflight.then((value) => {
      if (!cancelled) setOnAir(value);
    });
    const reset = window.setTimeout(() => {
      delete (globalThis as { __ysOnAir?: Promise<boolean> }).__ysOnAir;
    }, 30_000);
    return () => {
      cancelled = true;
      window.clearTimeout(reset);
    };
  }, []);

  return (
    <Link href="/live" aria-label={label} title={label} onClick={onNavigate} className={className}>
      <span className="relative flex h-2 w-2">
        {onAir ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${onAir ? 'bg-red-500' : 'bg-primary'}`} />
      </span>
      <Radio className="h-3.5 w-3.5" />
      <span className={showLabel ? undefined : 'hidden sm:inline'}>{label}</span>
    </Link>
  );
}
