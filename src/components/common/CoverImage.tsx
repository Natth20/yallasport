'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { EntityPortrait } from './EntityPortrait';

/** Rectangular photo. Remote news CDNs often block `/_next/image`, so those load as a plain img. */
export function CoverImage({
  src,
  alt = '',
  className,
  sizes,
  srcSet,
  priority = false,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  sizes: string;
  srcSet?: string;
  priority?: boolean;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const fade = `transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-60'}`;

  const url = !failed && src && src.length > 0 ? src : '';
  if (!url) {
    return <EntityPortrait name={alt} className={`absolute inset-0 z-0 h-full w-full rounded-none ${className ?? ''}`} />;
  }
  const remote = /^https?:\/\//i.test(url);

  if (remote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        className={`absolute inset-0 z-0 h-full w-full object-cover ${fade} ${className ?? ''}`}
        referrerPolicy="no-referrer"
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={(event) => {
          if (event.currentTarget.naturalWidth > 0) setLoaded(true);
        }}
        onError={() => {
          if (!failed) setFailed(true);
        }}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      quality={90}
      className={`${fade} ${className ?? ''}`}
      sizes={sizes}
      priority={priority}
      onLoad={() => setLoaded(true)}
    />
  );
}
