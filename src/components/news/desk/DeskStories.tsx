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
import { ArrowUpRight, Flame, Clock, Newspaper } from 'lucide-react';

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
    <Link href={`/news/${story.slug}`} className="news-cover">
      {cover ? (
        <div className="news-cover-media">
          <CoverImage src={cover} alt={story.title} sizes="(max-width: 1024px) 100vw, 860px" priority className="object-cover object-[center_28%]" />
        </div>
      ) : (
        <div className="news-cover-stage" aria-hidden />
      )}
      <div className="news-cover-wash" />
      <span className="news-cover-folio" aria-hidden>
        YS
      </span>
      <div className="news-cover-body">
        <p className="news-cover-kicker">
          <span className="h-px w-5 bg-orange-400/80" />
          {deskLabel(story.category, locale)}
          {story.breaking ? (
            <span className="inline-flex items-center gap-1 text-red-300">
              <Flame className="h-3 w-3" />
              {pick(locale, 'عاجل', 'Breaking')}
            </span>
          ) : null}
        </p>
        <h1 className="news-cover-title">{story.title}</h1>
        {story.excerpt ? <p className="news-cover-excerpt">{story.excerpt}</p> : null}
        <div className="news-cover-meta">
          <span>{story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}</span>
          {story.publishedAt ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-400" />
                <ClientTime value={story.publishedAt} />
              </span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span>{desk}</span>
        </div>
        {entities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {entities.slice(0, 4).map((entity) => (
              <span key={`${entity.type}-${entity.href}`} className="rounded-full border border-white/15 bg-black/25 px-2.5 py-0.5 text-[10px] font-bold text-white/80">
                {entity.name}
              </span>
            ))}
          </div>
        ) : null}
        <span className="news-cover-cta">
          {pick(locale, 'اقرأ التقرير', 'Read the report')}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
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
    <Link href={`/news/${story.slug}`} className="group news-sublead">
      <div className="news-sublead-media">
        {cover ? (
          <CoverImage src={cover} alt="" sizes="420px" className="object-cover object-[center_28%]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted">
            <Newspaper className="h-5 w-5 text-orange-500" />
          </span>
        )}
        <span className="news-photo-hover">
          <span className="news-photo-hover-kicker">{deskLabel(story.category, locale)}</span>
          <strong>{story.title}</strong>
          <span className="news-photo-hover-meta">
            {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
            {story.publishedAt ? (
              <>
                {' · '}
                <ClientTime value={story.publishedAt} />
              </>
            ) : null}
          </span>
        </span>
      </div>
      <div className="news-sublead-body">
        <span className="news-sublead-kicker">{deskLabel(story.category, locale)}</span>
        <h2 className="news-sublead-title">{story.title}</h2>
        <p className="news-sublead-meta">
          {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          {story.publishedAt ? (
            <>
              {' · '}
              <ClientTime value={story.publishedAt} />
            </>
          ) : null}
        </p>
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
    <Link href={`/news/${story.slug}`} className="news-log-row">
      <div className="news-log-media">
        {cover ? (
          <CoverImage src={cover} alt="" sizes="280px" className="object-cover object-[center_28%]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted">
            <Newspaper className="h-6 w-6 text-orange-500" />
          </span>
        )}
      </div>
      <div className="news-log-body">
        <span className="news-log-kicker">{deskLabel(story.category, locale)}</span>
        <h3>{story.title}</h3>
        {story.excerpt ? <p>{story.excerpt}</p> : null}
        <span className="news-log-meta">
          {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
          {story.publishedAt ? (
            <>
              {' · '}
              <ClientTime value={story.publishedAt} />
            </>
          ) : null}
        </span>
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
    <Link href={`/news/${brief.slug}`} className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-foreground/5">
      <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-primary shadow-sm shadow-primary" />
      <div className="flex-1">
        <p className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover:text-primary">{brief.title}</p>
        <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">
          {brief.sourceName ? `${brief.sourceName} · ` : null}
          {brief.publishedAt ? <ClientTime value={brief.publishedAt} /> : null}
        </span>
      </div>
    </Link>
  );
}
