import Image from 'next/image';
import { LOGO_PATH } from '@/lib/seo/site';

type BrandMarkProps = {
  size?: number;
  priority?: boolean;
  className?: string;
};

export function BrandMark({ size = 40, priority = false, className = '' }: BrandMarkProps) {
  return (
    <Image
      src={LOGO_PATH}
      alt="Yalla Sport"
      width={size}
      height={size}
      className={`shrink-0 rounded-lg bg-black object-contain ${className}`}
      priority={priority}
    />
  );
}
