import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import styles from './house.module.css';

export function HouseMark({
  num,
  title,
  note,
  href,
  cta,
}: {
  num: string;
  title: string;
  note?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <header className={styles.mark}>
      <em>{num}</em>
      <div>
        <h2>{title}</h2>
      </div>
      {note ? <p>{note}</p> : null}
      {href && cta ? (
        <Link href={href as '/'}>{cta}</Link>
      ) : null}
    </header>
  );
}

export function HousePlate({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.plate} ${className}`.trim()}>{children}</div>;
}

