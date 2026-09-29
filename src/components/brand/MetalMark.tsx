import Image from 'next/image';
import styles from './metal-mark.module.css';

const PX = { sm: 40, md: 68, lg: 120, xl: 220 } as const;

export function MetalMark({
  size = 'md',
  priority = false,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
}) {
  const px = PX[size];

  return (
    <div className={`${styles.plate} ${styles[size]}`}>
      <Image
        src="/images/logo.png"
        alt=""
        width={px}
        height={px}
        sizes={`${px}px`}
        priority={priority}
        className={styles.logo}
      />
      <span className={styles.sheen} aria-hidden />
    </div>
  );
}
