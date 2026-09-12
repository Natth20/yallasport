import Image from 'next/image';

type BrandMarkProps = {
  size?: number;
  priority?: boolean;
  className?: string;
};

export function BrandMark({ size = 40, priority = false, className = '' }: BrandMarkProps) {
  return (
    <Image
      src="/images/logo.jpg"
      alt="Yalla Sport"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: 'auto', height: 'auto' }}
      priority={priority}
    />
  );
}
