import { Link } from '@/i18n/navigation';
import { CalendarDays, History, ListOrdered, Target, Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

type LeagueChapter = 'hub' | 'standings' | 'scorers' | 'fixtures' | 'archive';

const chapters: Array<{
  id: LeagueChapter;
  href: (slug: string) => string;
  label: 'overview' | 'standings' | 'scorers' | 'fixtures' | 'archive';
  icon: typeof Trophy;
}> = [
  { id: 'hub', href: (slug) => `/league/${slug}`, label: 'overview', icon: CalendarDays },
  { id: 'fixtures', href: (slug) => `/league/${slug}/fixtures`, label: 'fixtures', icon: ListOrdered },
  { id: 'standings', href: (slug) => `/league/${slug}/standings`, label: 'standings', icon: Trophy },
  { id: 'scorers', href: (slug) => `/league/${slug}/top-scorers`, label: 'scorers', icon: Target },
  { id: 'archive', href: (slug) => `/league/${slug}/archive`, label: 'archive', icon: History },
];

export async function LeagueChapterNav({
  slug,
  current,
}: {
  slug: string;
  current: LeagueChapter;
}) {
  const t = await getTranslations('sports');
  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/80 bg-card p-1 no-scrollbar dark:border-border dark:bg-white/[0.035]">
      {chapters.map((chapter) => {
        const active = chapter.id === current;
        return (
          <Link
            key={chapter.id}
            href={chapter.href(slug)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[10px] font-semibold transition-all sm:px-4 ${
              active
                ? 'bg-foreground text-white shadow-sm dark:bg-card dark:text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white'
            }`}
          >
            <chapter.icon className={`h-3.5 w-3.5 ${active ? 'text-orange-400' : ''}`} />
            {t(chapter.label)}
          </Link>
        );
      })}
    </nav>
  );
}

export default LeagueChapterNav;
