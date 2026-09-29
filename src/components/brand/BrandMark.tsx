import { LOGO_PATH } from '@/lib/seo/site';

type BrandMarkProps = {
  size?: number;
  priority?: boolean;
  className?: string;
};

/** Local PNG — skip next/image so client halls (Header) do not mismatch srcset on hydrate. */
export function BrandMark({ size = 40, priority = false, className = '' }: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_PATH}
      alt="Yalla Sport"
      width={size}
      height={size}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      className={`shrink-0 rounded-full bg-[#0b0b0b] object-contain ${className}`}
    />
  );
}
