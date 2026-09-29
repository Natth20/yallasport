'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { YOUTUBE_EMBED_BLOCKED } from '@/lib/youtube/channels';
import { youtubeCopy } from '@/lib/youtube/present';
import styles from './youtube.module.css';

export type YoutubeClipCard = {
  youtubeId: string;
  title: string;
  channelId?: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  description: string | null;
  lang: string;
  durationSec: number | null;
};

export type YoutubeCopy = ReturnType<typeof youtubeCopy>;

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function embedSrc(youtubeId: string, origin?: string) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  });
  if (origin) params.set('origin', origin);
  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}

function isBlockedChannel(channelId?: string) {
  return Boolean(channelId && YOUTUBE_EMBED_BLOCKED.has(channelId));
}

function pickStartId(clips: YoutubeClipCard[], initialId?: string | null) {
  if (initialId && clips.some((clip) => clip.youtubeId === initialId)) return initialId;
  return clips.find((clip) => !isBlockedChannel(clip.channelId))?.youtubeId || clips[0]?.youtubeId || null;
}

function YoutubeStage({
  clip,
  reel,
  labels,
}: {
  clip: YoutubeClipCard;
  reel: boolean;
  labels: YoutubeCopy;
}) {
  const knownBlocked = isBlockedChannel(clip.channelId);
  const [blocked, setBlocked] = useState(knownBlocked);
  const [origin, setOrigin] = useState('');
  const watch = watchSrc(clip.youtubeId, reel);
  const poster = clip.thumbnailUrl || `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setBlocked(knownBlocked);
    if (knownBlocked) return undefined;
    function onMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.youtube.com') return;
      let payload: unknown = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (!payload || typeof payload !== 'object') return;
      const data = payload as { event?: string; info?: number };
      if (data.event === 'onError' && (data.info === 101 || data.info === 150 || data.info === 100 || data.info === 5)) {
        setBlocked(true);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [clip.youtubeId, knownBlocked]);

  if (blocked) {
    return (
      <div className={`${styles['yt-player']} ${styles['is-blocked']}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt="" />
        <div className={styles['yt-blocked']}>
          <p>{labels.embedBlocked}</p>
          <a href={watch} target="_blank" rel="noopener noreferrer">
            {labels.watchOnYoutube}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['yt-player']}>
      <iframe
        key={clip.youtubeId}
        title={clip.title}
        src={embedSrc(clip.youtubeId, origin)}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function watchSrc(youtubeId: string, reel: boolean) {
  return reel
    ? `https://www.youtube.com/shorts/${youtubeId}`
    : `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function YoutubeDesk({
  clips: initialClips,
  variant,
  initialId,
  empty,
  archiveHref,
  archiveLabel,
  locale,
  copy,
}: {
  clips: YoutubeClipCard[];
  variant: 'video' | 'reel';
  initialId?: string | null;
  empty: string;
  archiveHref?: string;
  archiveLabel?: string;
  locale: string;
  copy?: YoutubeCopy;
}) {
  const [clips, setClips] = useState(initialClips);
  const [active, setActive] = useState(() => pickStartId(initialClips, initialId));
  const [channel, setChannel] = useState('ALL');
  const [query, setQuery] = useState('');
  const stageRef = useRef<HTMLElement>(null);
  const labels = copy ?? youtubeCopy(locale || 'ar');
  const ar = locale === 'ar';

  const channels = useMemo(() => {
    const map = new Map<string, string>();
    for (const clip of clips) {
      if (clip.channelId) map.set(clip.channelId, clip.channelTitle);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [clips]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clips.filter((clip) => {
      if (channel !== 'ALL' && clip.channelId !== channel) return false;
      if (!q) return true;
      return `${clip.title} ${clip.channelTitle}`.toLowerCase().includes(q);
    });
  }, [channel, clips, query]);

  const current = visible.find((clip) => clip.youtubeId === active) || visible[0] || clips[0];

  useEffect(() => {
    setClips(initialClips);
    setActive((prev) => (prev && initialClips.some((clip) => clip.youtubeId === prev) ? prev : pickStartId(initialClips, initialId)));
  }, [initialClips, initialId]);

  useEffect(() => {
    const kind = variant === 'reel' ? 'SHORT' : 'VIDEO';
    const pull = async () => {
      try {
        const res = await fetch(`/api/media/videos?kind=${kind}&locale=${locale}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { clips?: YoutubeClipCard[] };
        if (!Array.isArray(data.clips) || data.clips.length === 0) return;
        setClips(data.clips);
        setActive((prev) => (prev && data.clips!.some((clip) => clip.youtubeId === prev) ? prev : pickStartId(data.clips!, initialId)));
      } catch {
        // keep the last shelf
      }
    };
    const timer = window.setInterval(pull, 90_000);
    const first = window.setTimeout(pull, 3_000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
    };
  }, [initialId, locale, variant]);

  if (!current) {
    return (
      <div className={styles['yt-empty']}>
        <span className={styles['yt-empty-mark']} aria-hidden />
        <strong>{empty}</strong>
      </div>
    );
  }

  const isReel = variant === 'reel';
  const langLabel = current.lang === 'ar' ? labels.arabic : labels.english;

  function show(id: string) {
    setActive(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('v', id);
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
  }

  function step(delta: number) {
    if (visible.length < 2) return;
    const index = Math.max(0, visible.findIndex((clip) => clip.youtubeId === current?.youtubeId));
    const next = visible[(index + delta + visible.length) % visible.length];
    if (next) show(next.youtubeId);
  }

  return (
    <div className={`${styles['yt-cinema']}${isReel ? ` ${styles['is-reel']}` : ''}`}>
      <section ref={stageRef} className={styles['yt-screen']} aria-live="polite">
        <div className={styles['yt-frame']}>
          <YoutubeStage clip={current} reel={isReel} labels={labels} />
          {visible.length > 1 ? (
            <>
              <button type="button" className={`${styles['yt-step']} ${styles['is-prev']}`} onClick={() => step(-1)} aria-label={ar ? 'السابق' : 'Previous'}>
                ‹
              </button>
              <button type="button" className={`${styles['yt-step']} ${styles['is-next']}`} onClick={() => step(1)} aria-label={ar ? 'التالي' : 'Next'}>
                ›
              </button>
            </>
          ) : null}
        </div>
        <div className={styles['yt-program']}>
          <div className={styles['yt-chips']}>
            <span>{current.channelTitle}</span>
            <span>{langLabel}</span>
            {typeof current.durationSec === 'number' && current.durationSec > 0 ? (
              <span>{clock(current.durationSec)}</span>
            ) : null}
            <span>
              <ClientTime
                locale={locale}
                value={current.publishedAt}
                options={{ day: 'numeric', month: 'short' }}
              />
            </span>
          </div>
          <h2>{current.title}</h2>
          <p className={styles['yt-source']}>
            {labels.source} · {labels.youtube} · {labels.notLive}
            {' · '}
            <a href={watchSrc(current.youtubeId, isReel)} target="_blank" rel="noopener noreferrer">
              {labels.watchOnYoutube}
            </a>
          </p>
        </div>
      </section>

      <section className={styles['yt-shelf']}>
        <header className={styles['yt-shelf-head']}>
          <div>
            <h3>{labels.shelf}</h3>
            <p>{labels.shelfLead}</p>
          </div>
          <b>{visible.length}</b>
        </header>
        <div className={styles['yt-tools']}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ar ? 'صفِّ الرف بالاسم…' : 'Filter the shelf…'}
            className={styles['yt-filter']}
          />
          {channels.length > 1 ? (
            <div className={styles['yt-rail']} role="tablist">
              <button type="button" className={channel === 'ALL' ? styles['is-on'] : undefined} onClick={() => setChannel('ALL')}>
                {ar ? 'كل القنوات' : 'All channels'}
              </button>
              {channels.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={channel === item.id ? styles['is-on'] : undefined}
                  onClick={() => setChannel(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {visible.length === 0 ? (
          <p className={styles['yt-filter-empty']}>{ar ? 'ما في كليب بهالفلتر من المصدر.' : 'No clip on the shelf matches this filter.'}</p>
        ) : (
          <div className={isReel ? styles['yt-reel-grid'] : styles['yt-video-grid']}>
            {visible.map((clip, index) => {
              const on = clip.youtubeId === current.youtubeId;
              return (
                <button
                  key={clip.youtubeId}
                  type="button"
                  className={`${styles['yt-tile']}${isReel ? ` ${styles['is-reel']}` : ''}${on ? ` ${styles['is-on']}` : ''}`}
                  onClick={() => show(clip.youtubeId)}
                  aria-pressed={on}
                  aria-label={`${labels.play}: ${clip.title}`}
                >
                  <span className={styles['yt-poster']}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clip.thumbnailUrl || `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`}
                      alt=""
                    />
                    {typeof clip.durationSec === 'number' && clip.durationSec > 0 ? (
                      <time>{clock(clip.durationSec)}</time>
                    ) : null}
                    {on ? <em className={styles['yt-live-tag']}>{labels.nowPlaying}</em> : null}
                  </span>
                  <span className={styles['yt-tile-copy']}>
                    <span className={styles['yt-index']}>{String(index + 1).padStart(2, '0')}</span>
                    <b>{clip.title}</b>
                    <em>
                      {clip.channelTitle}
                      {' · '}
                      <ClientTime
                        locale={locale}
                        value={clip.publishedAt}
                        options={{ day: 'numeric', month: 'short' }}
                      />
                    </em>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {archiveHref && archiveLabel ? (
        <p className={styles['yt-ticket-wrap']}>
          <Link href={archiveHref} className={styles['yt-ticket']}>
            <span>{archiveLabel}</span>
            <i aria-hidden />
          </Link>
        </p>
      ) : null}
    </div>
  );
}
