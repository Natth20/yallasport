import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { publicStoryImage } from '@/lib/news/enrich-source';
import { deskAuthorLabel } from '@/lib/news/format-body';
import { deskLabel } from '@/lib/news/desks';
import { pick } from '@/i18n/pick';
import type { NewsEntityChip } from '@/lib/news/entity-suggest';
import type { Brief, Story } from '@/lib/news/load-desk';
import { ArrowUpRight, Crown, Flame, Clock, Eye, Sparkles, Newspaper } from 'lucide-react';

/** The front-page lead — Ultra-modern Bento Feature Story */
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
      className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 sm:p-8 min-h-[460px] shadow-2xl transition-all duration-500 hover:border-primary/50 hover:shadow-primary/10"
    >
      {/* Background Media with smooth Zoom */}
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={story.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-primary/10" />
      )}

      {/* Dark luxury gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/75 to-transparent opacity-95 transition-opacity group-hover:opacity-90" />
      <div className="absolute inset-0 bg-radial from-transparent to-[#0b1220]/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1 text-xs font-black text-white shadow-lg shadow-primary/30">
            <Sparkles className="h-3.5 w-3.5" />
            {deskLabel(story.category, locale)}
          </span>

          {story.breaking && (
            <span className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1 text-xs font-black uppercase text-white shadow-lg shadow-red-600/30 animate-pulse">
              <Flame className="h-3.5 w-3.5" />
              {pick(locale, 'عاجل', 'Breaking')}
            </span>
          )}

          {story.isPremium && (
            <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
              <Crown className="h-3.5 w-3.5" />
              {pick(locale, 'خاص وحصري', 'Exclusive')}
            </span>
          )}
        </div>

        <h1 className="text-xl font-black leading-tight text-white transition-colors group-hover:text-primary sm:text-2xl md:text-3xl lg:text-4xl">
          {story.title}
        </h1>

        {story.excerpt && (
          <p className="line-clamp-2 text-xs leading-relaxed text-foreground/80 sm:text-sm max-w-3xl">
            {story.excerpt}
          </p>
        )}

        {/* Metadata Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs font-semibold text-foreground/60">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-foreground/90 font-bold">
              {story.sourceName || pick(locale, 'يلا سبورت', 'YallaSport')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {story.publishedAt && <ClientTime value={story.publishedAt} />}
            </span>
            <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] text-white">
              {story.readingTime > 0
                ? `${story.readingTime} ${pick(locale, 'دقائق قراءة', 'min read')}`
                : pick(locale, 'قراءة سريعة', 'Quick read')}
            </span>
          </div>

          <span className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/30">
            <span>{pick(locale, 'قراءة التفاصيل', 'Read Story')}</span>
            <ArrowUpRight className="h-4 w-4 rtl:rotate-[-90deg] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>

        {/* Tagged entities */}
        {entities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {entities.slice(0, 4).map((entity) => (
              <span
                key={`${entity.type}-${entity.href}`}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-foreground/75 backdrop-blur-md"
              >
                #{entity.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

/** Secondary featured story — horizontal card */
export function NewsSubLead({
  story,
  locale,
  index,
}: {
  story: Story;
  locale: string;
  index: number;
}) {
  const cover = publicStoryImage(story);
  const desk = deskAuthorLabel(story.author.name, locale, pick);

  return (
    <Link
      href={`/news/${story.slug}`}
      className="group relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-3.5 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:bg-card/90 hover:shadow-xl hover:shadow-primary/5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video sm:w-44 shrink-0 overflow-hidden rounded-xl bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={story.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-md">
          {deskLabel(story.category, locale)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-2 p-2 sm:px-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-black text-foreground transition-colors group-hover:text-primary sm:text-base">
            {story.title}
          </h3>
          {story.excerpt && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {story.excerpt}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pt-2 border-t border-white/5">
          <span>{story.sourceName || pick(locale, 'المصدر', 'Source')}</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-primary" />
            {story.publishedAt && <ClientTime value={story.publishedAt} />}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Regular grid news tile */
export function NewsTile({
  story,
  locale,
  index,
  entities,
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={story.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
        )}
        <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-md">
          {deskLabel(story.category, locale)}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 gap-3">
        <h3 className="line-clamp-2 text-sm font-black leading-snug text-foreground transition-colors group-hover:text-primary">
          {story.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pt-2 border-t border-white/5">
          <span className="truncate max-w-[120px]">{story.sourceName || pick(locale, 'يلا سبورت', 'YallaSport')}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />
            {story.publishedAt && <ClientTime value={story.publishedAt} />}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Breaking short news brief */
export function NewsBriefRow({ brief, locale }: { brief: Brief; locale: string }) {
  return (
    <Link
      href={`/news/${brief.slug}`}
      className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-foreground/5"
    >
      <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-primary shadow-sm shadow-primary" />
      <div className="flex-1">
        <p className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
          {brief.title}
        </p>
        <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">
          {brief.publishedAt && <ClientTime value={brief.publishedAt} />}
        </span>
      </div>
    </Link>
  );
}
