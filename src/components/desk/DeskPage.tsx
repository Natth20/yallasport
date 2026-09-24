import { Link } from '@/i18n/navigation';

export function DeskPage({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="desk-folio mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">{kicker}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p>
      <div className="mt-10">{children}</div>
    </div>
  );
}

export function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground"
      >
        {options.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EmptyDesk({ text }: { text: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-border bg-card/40 px-6 py-16 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export function DeskLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-bold text-primary hover:underline">
      {children}
    </Link>
  );
}
