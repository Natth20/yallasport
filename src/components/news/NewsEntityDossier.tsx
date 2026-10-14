import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { ArrowUpRight, Calendar, Shield, Trophy, User } from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';

export type EntityDossierProps = {
  locale: string;
  entity: {
    type: 'TEAM' | 'LEAGUE' | 'PLAYER';
    name: string;
    slug: string;
    logoUrl?: string | null;
    meta?: string;
    city?: string;
    country?: string;
  };
  upcomingMatch?: {
    id: string;
    kickoffAt: string | Date;
    homeTeam: { name: string; logoUrl?: string | null };
    awayTeam: { name: string; logoUrl?: string | null };
    league: { name: string };
  } | null;
};

export function NewsEntityDossier({ locale, entity, upcomingMatch }: EntityDossierProps) {
  const entityHref =
    entity.type === 'TEAM'
      ? `/team/${entity.slug}`
      : entity.type === 'LEAGUE'
        ? `/league/${entity.slug}`
        : `/player/${entity.slug}`;

  const typeLabel =
    entity.type === 'TEAM'
      ? pick(locale, 'النادي المذكور', 'Mentioned club')
      : entity.type === 'LEAGUE'
        ? pick(locale, 'البطولة المذكورة', 'Mentioned league')
        : pick(locale, 'اللاعب المذكور', 'Mentioned player');

  const Icon = entity.type === 'TEAM' ? Shield : entity.type === 'LEAGUE' ? Trophy : User;

  return (
    <section className="my-6 rounded-2xl border border-orange-500/25 bg-gradient-to-br from-card via-card/95 to-orange-500/5 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
              {typeLabel}
            </span>
            <h3 className="text-sm font-black text-foreground">
              {entity.name}
            </h3>
          </div>
        </div>

        <Link
          href={entityHref}
          className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 transition-all hover:bg-orange-500 hover:text-white"
        >
          <span>{pick(locale, 'الملف الكامل', 'Full dossier')}</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {entity.logoUrl ? (
            <img
              src={entity.logoUrl}
              alt={entity.name}
              className="h-12 w-12 rounded-xl object-contain bg-background/80 p-1 border border-border/60"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground font-black text-lg">
              {entity.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-foreground">
              {entity.name}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              {[entity.meta, entity.city, entity.country].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {/* Linked Upcoming Match */}
        {upcomingMatch ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-xs">
            <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-muted-foreground">
                {pick(locale, 'المواجهة القادمة', 'Upcoming fixture')} · <ClientTime value={upcomingMatch.kickoffAt} variant="clock" />
              </span>
              <Link
                href={`/match/${upcomingMatch.id}`}
                className="font-bold text-foreground hover:text-orange-500 truncate block hover:underline"
              >
                {upcomingMatch.homeTeam.name} × {upcomingMatch.awayTeam.name}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
