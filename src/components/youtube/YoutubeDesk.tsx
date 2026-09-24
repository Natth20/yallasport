'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';
import { YOUTUBE_EMBED_BLOCKED } from '@/lib/youtube/channels';
import { youtubeCopy } from '@/lib/youtube/present';
import './youtube.css';

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

function embedSrc(youtubeId: string) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  });
  if (typeof window !== 'undefined' && window.location.origin) {
    params.set('origin', window.location.origin);
  }
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
  const watch = watchSrc(clip.youtubeId, reel);
  const poster = clip.thumbnailUrl || `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`;

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
      <div className="yt-player is-blocked">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt="" />
        <div className="yt-blocked">
          <p>{labels.embedBlocked}</p>
          <a href={watch} target="_blank" rel="noopener noreferrer">
            {labels.watchOnYoutube}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="yt-player">
      <iframe
        key={clip.youtubeId}
        title={clip.title}
        src={embedSrc(clip.youtubeId)}
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
  clips,
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
  const [active, setActive] = useState(() => pickStartId(clips, initialId));
  const stageRef = useRef<HTMLElement>(null);
  const current = clips.find((clip) => clip.youtubeId === active) || clips[0];
  const labels = copy ?? youtubeCopy(locale || 'ar');

  if (!current) {
    return (
      <div className="yt-empty">
        <span className="yt-empty-mark" aria-hidden />
        <strong>{empty}</strong>
      </div>
    );
  }

  const isReel = variant === 'reel';
  const langLabel = current.lang === 'ar' ? labels.arabic : labels.english;

  function show(id: string) {
    setActive(id);
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={`yt-cinema${isReel ? ' is-reel' : ''}`}>
      <section ref={stageRef} className="yt-screen" aria-live="polite">
        <div className="yt-screen-glow" aria-hidden />
        <div className="yt-frame">
          <span className="yt-bracket is-tl" aria-hidden />
          <span className="yt-bracket is-tr" aria-hidden />
          <span className="yt-bracket is-bl" aria-hidden />
          <span className="yt-bracket is-br" aria-hidden />
          <div className="yt-marquee">
            <b>{labels.nowShowing}</b>
            <em>{current.channelTitle}</em>
          </div>
          <YoutubeStage clip={current} reel={isReel} labels={labels} />
        </div>
        <div className="yt-program">
          <div className="yt-chips">
            <span>{current.channelTitle}</span>
            <span>{langLabel}</span>
            {typeof current.durationSec === 'number' && current.durationSec > 0 ? (
              <span>{clock(current.durationSec)}</span>
            ) : null}
            <span>
              <ClientTime
                locale={locale}
                value={current.publishedAt}
                options={{ weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }}
              />
            </span>
          </div>
          <h2>{current.title}</h2>
          {current.description ? <p className="yt-blurb">{current.description}</p> : null}
          <p className="yt-source">
            {labels.source} · {labels.youtube} · {labels.notLive}
            {' · '}
            <a href={watchSrc(current.youtubeId, isReel)} target="_blank" rel="noopener noreferrer">
              {labels.watchOnYoutube}
            </a>
          </p>
        </div>
      </section>

      <section className="yt-shelf">
        <header className="yt-shelf-head">
          <div>
            <h3>{labels.shelf}</h3>
            <p>{labels.shelfLead}</p>
          </div>
          <b>{clips.length}</b>
        </header>
        <Stagger className={isReel ? 'yt-reel-grid' : 'yt-video-grid'} delay={0.03}>
          {clips.map((clip) => {
            const on = clip.youtubeId === current.youtubeId;
            return (
              <StaggerItem key={clip.youtubeId}>
                <button
                  type="button"
                  className={`yt-tile${isReel ? ' is-reel' : ''}${on ? ' is-on' : ''}`}
                  onClick={() => show(clip.youtubeId)}
                  aria-pressed={on}
                  aria-label={`${labels.play}: ${clip.title}`}
                >
                  <span className="yt-poster">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clip.thumbnailUrl || `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`}
                      alt=""
                    />
                    <i className="yt-play" aria-hidden />
                    {typeof clip.durationSec === 'number' && clip.durationSec > 0 ? (
                      <time>{clock(clip.durationSec)}</time>
                    ) : null}
                    {on ? <em className="yt-live-tag">{labels.nowPlaying}</em> : null}
                  </span>
                  <span className="yt-tile-copy">
                    <b>{clip.title}</b>
                    <em>
                      {clip.channelTitle}
                      {' · '}
                      {clip.lang === 'ar' ? labels.arabic : labels.english}
                      {' · '}
                      <ClientTime
                        locale={locale}
                        value={clip.publishedAt}
                        options={{ day: 'numeric', month: 'short' }}
                      />
                    </em>
                  </span>
                </button>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {archiveHref && archiveLabel ? (
        <p className="yt-ticket-wrap">
          <Link href={archiveHref} className="yt-ticket">
            <span>{archiveLabel}</span>
            <i aria-hidden />
          </Link>
        </p>
      ) : null}
    </div>
  );
}
