'use client';

import { useState } from 'react';

export function TransferFace({
  src,
  name,
  className = '',
  fallbackClassName = '',
}: {
  src: string | null;
  name: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0) || '•';

  if (!src || failed) {
    return <i className={fallbackClassName || className}>{initial}</i>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
