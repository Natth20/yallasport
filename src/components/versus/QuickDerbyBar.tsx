'use client';

import { Link } from '@/i18n/navigation';
import styles from './compare.module.css';

export type DerbyLink = {
  key: string;
  label: string;
  href: string;
  tag: string;
  active: boolean;
};

export function QuickDerbyBar({
  items,
  locale = 'ar',
}: {
  items: DerbyLink[];
  locale?: string;
}) {
  if (items.length === 0) return null;
  const isAr = locale === 'ar';

  return (
    <div className={styles.derby}>
      <h3>{isAr ? 'ديربيات من الدفتر' : 'Derbies on the ledger'}</h3>
      <div className={styles.derbyRow}>
        {items.map((derby) => (
          <Link key={derby.key} href={derby.href} className={derby.active ? styles.derbyOn : undefined}>
            {derby.label}
            <span className={styles.tag}>{derby.tag}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
