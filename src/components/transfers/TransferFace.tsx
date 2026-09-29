'use client';

import { useState } from 'react';

export function TransferFace({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <i>{name.trim().charAt(0) || '•'}</i>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" onError={() => setFailed(true)} />
  );
}
