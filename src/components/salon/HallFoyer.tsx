import { Link } from '@/i18n/navigation';
import type { LucideIcon } from 'lucide-react';

export type HallFoyerItem = {
  href: string;
  label: string;
  badge?: string;
  icon?: LucideIcon;
  current?: boolean;
};

export function HallFoyer({
  label,
  items,
}: {
  label: string;
  items: HallFoyerItem[];
}) {
  return (
    <div className="salon-foyer">
      <nav className="salon-tabs" aria-label={label}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`salon-tab${item.current ? ' is-on' : ''}`}
              aria-current={item.current ? 'page' : undefined}
            >
              {Icon ? <Icon size={14} style={{ marginInlineEnd: '0.4rem' }} aria-hidden /> : null}
              <span>{item.label}</span>
              {item.badge ? <em className="salon-tab-badge">{item.badge}</em> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
