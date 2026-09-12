'use client';

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
    fetch('/api/stream/availability')
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setOnAir(Array.isArray(data?.items) && data.items.length > 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link href="/live" aria-label={label} title={label} onClick={onNavigate} className={className}>
      <span className="relative flex h-2 w-2">
        {onAir ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${onAir ? 'bg-red-500' : 'bg-[#c26a3a]'}`} />
      </span>
      <Radio className="h-3.5 w-3.5" />
      <span className={showLabel ? undefined : 'hidden sm:inline'}>{label}</span>
    </Link>
  );
}
