'use client';

import { Link } from '@/i18n/navigation';

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
    <div className="mb-8 rounded-2xl border border-primary/20 bg-card/80 p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider">
        {isAr ? 'ديربيات من الدفتر' : 'Derbies on the ledger'}
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((derby) => (
          <Link
            key={derby.key}
            href={derby.href}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
              derby.active
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:border-primary'
            }`}
          >
            {derby.label}
            <span className="ms-1 text-[9px] opacity-60">{derby.tag}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
