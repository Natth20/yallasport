import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { CoverImage } from '@/components/common/CoverImage';
import { publicStoryImage } from '@/lib/news/enrich-source';
import { deskAuthorLabel } from '@/lib/news/format-body';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { NewsEntityChip } from '@/lib/news/entity-suggest';
import type { Brief, Story } from '@/lib/news/load-desk';
import { ArrowUpRight, Flame, Clock, Newspaper, Sparkles } from 'lucide-react';

/** Front-page lead: large photo, real source, no invented copy. */
export function NewsCover({
  story,
  locale,
  entities,
}: {
  story: Story;
  locale: string;
  entities: NewsEntityChip[];
}) {
  const cover = publicStoryImage(story);
  const desk = deskAuthorLabel(story.author.name, locale, pick);

  return (
    <Link
      href={`/news/${story.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-border/80 bg-card/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 md:p-8"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/40">
        {cover ? (
          <CoverImage
            src={cover}
            alt={story.title}
            sizes="(max-width: 1024px) 100vw, 860px"
            priority
            className="object-cover object-[center_28%] transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/40">
            <Newspaper className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        
        {/* Floating Brand Badge */}
        <span className="absolute top-4 start-4 flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-primary" />
          YS Desk
        </span>

        {/* Inner Media Info */}
        <div className="absolute bottom-4 start-4 end-4 flex flex-wrap items-end justify-between gap-3 text-white">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-0.5 text-[10px] font-extrabold text-primary-foreground">
                {deskLabel(story.category, locale)}
              </span>
              {story.breaking ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[10px] font-extrabold text-white animate-pulse">
                  <Flame className="h-3 w-3" />
                  {pick(locale, 'عاجل', 'Breaking')}
                </span>
              ) : null}
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-md transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            {pick(locale, 'اقرأ التقرير', 'Read report')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <h1 className="text-xl font-black leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl lg:text-3xl">
          {story.title}
        </h1>
        {story.excerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {story.excerpt}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-muted-foreground">
          <span className="font-bold text-foreground/90">
            {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          </span>
          {story.publishedAt ? (
            <>
              <span aria-hidden className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <ClientTime value={story.publishedAt} />
              </span>
            </>
          ) : null}
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <span>{desk}</span>
        </div>

        {entities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {entities.slice(0, 4).map((entity) => (
              <span
                key={`${entity.type}-${entity.href}`}
                className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold text-foreground/80 transition-colors group-hover:border-primary/30"
              >
                {entity.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function NewsSubLead({
  story,
  locale,
}: {
  story: Story;
  locale: string;
  index?: number;
}) {
  const cover = publicStoryImage(story);

  return (
    <Link
      href={`/news/${story.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-black/30">
        {cover ? (
          <CoverImage
            src={cover}
            alt=""
            sizes="420px"
            className="object-cover object-[center_28%] transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted/50">
            <Newspaper className="h-6 w-6 text-primary/40" />
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />
        <span className="absolute bottom-2 start-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-extrabold text-white backdrop-blur-sm">
          {deskLabel(story.category, locale)}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between pt-3">
        <h2 className="line-clamp-2 text-sm font-black leading-snug text-foreground transition-colors group-hover:text-primary">
          {story.title}
        </h2>
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span className="truncate max-w-[65%]">
            {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          </span>
          {story.publishedAt ? (
            <span className="shrink-0 text-[10px]">
              <ClientTime value={story.publishedAt} />
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** Dense log row so the approved list fills beside the sidebar. */
export function NewsLogRow({
  story,
  locale,
}: {
  story: Story;
  locale: string;
  index?: number;
  entities?: NewsEntityChip[];
}) {
  const cover = publicStoryImage(story);

  return (
    <Link
      href={`/news/${story.slug}`}
      className="group grid grid-cols-[5.5rem_1fr] gap-3.5 rounded-2xl border border-border/60 bg-card/40 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-card/70"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/20">
        {cover ? (
          <CoverImage
            src={cover}
            alt=""
            sizes="280px"
            className="object-cover object-[center_28%] transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted/40">
            <Newspaper className="h-5 w-5 text-primary/40" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
          {deskLabel(story.category, locale)}
        </span>
        <h3 className="line-clamp-2 text-xs font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-sm">
          {story.title}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
          <span className="truncate">{story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}</span>
          {story.publishedAt ? (
            <>
              <span aria-hidden>·</span>
              <ClientTime value={story.publishedAt} />
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function NewsTile({
  story,
  locale,
}: {
  story: Story;
  locale: string;
  index?: number;
  entities?: NewsEntityChip[];
}) {
  return <NewsLogRow story={story} locale={locale} />;
}

export function NewsBriefRow({ brief, locale }: { brief: Brief; locale: string }) {
  return (
    <Link
      href={`/news/${brief.slug}`}
      className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-primary/5 hover:ps-3"
    >
      <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-primary shadow-sm shadow-primary" />
      <div className="flex-1 min-w-0">
        <p className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
          {brief.title}
        </p>
        <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">
          {brief.sourceName ? `${brief.sourceName} · ` : null}
          {brief.publishedAt ? <ClientTime value={brief.publishedAt} /> : null}
        </span>
      </div>
    </Link>
  );
}
