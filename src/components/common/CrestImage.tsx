import Image from 'next/image';
import { EntityPortrait } from './EntityPortrait';

export function CrestImage({
  src,
  alt = '',
  name,
  size,
  className,
  priority = false,
}: {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  const url = src?.trim();
  if (!url) {
    return <EntityPortrait name={name || alt} size={size} className={className} />;
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={size}
      height={size}
      className={className}
      sizes={`${size}px`}
      priority={priority}
    />
  );
}
