'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { YOUTUBE_EMBED_BLOCKED } from '@/lib/youtube/channels';
import { youtubeCopy } from '@/lib/youtube/present';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ExternalLink,
  Clock,
  Calendar,
  Globe2,
  CheckCircle2,
  Sparkles,
  Archive,
  Film,
  Flame,
  Radio,
} from 'lucide-react';
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
          <div className={styles['yt-blocked-card']}>
            <p>{labels.embedBlocked}</p>
            <a href={watch} target="_blank" rel="noopener noreferrer" className={styles['yt-blocked-btn']}>
              <Play size={15} fill="currentColor" />
              <span>{labels.watchOnYoutube}</span>
              <ExternalLink size={14} />
            </a>
          </div>
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
        <div className={styles['yt-empty-glow']} aria-hidden />
        <span className={styles['yt-empty-mark']}>
          {variant === 'reel' ? <Flame size={24} /> : <Film size={24} />}
        </span>
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

  const queue = visible.slice(0, 8);

  return (
    <div className={`${styles['yt-cinema']}${isReel ? ` ${styles['is-reel']}` : ''}`}>
      <div className={styles['yt-console']}>
        <section ref={stageRef} className={styles['yt-screen']} aria-live="polite">
          <div className={styles['yt-chassis']}>
            {/* Top Cinema Bezel */}
            <div className={styles['yt-bezel']}>
              <div className={styles['yt-bezel-left']}>
                <span className={styles['yt-equalizer']} aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span className={styles['yt-bezel-status']}>
                  {isReel ? (ar ? 'استوديو ريلز' : 'Reels Studio') : (ar ? 'شاشة العرض السينمائية' : 'Main Cinema Theater')}
                </span>
              </div>
              <div className={styles['yt-bezel-right']}>
                <span className={styles['yt-bezel-hd']}>1080p HD</span>
                {typeof current.durationSec === 'number' && current.durationSec > 0 ? (
                  <span className={styles['yt-bezel-clock']}>{clock(current.durationSec)}</span>
                ) : null}
              </div>
            </div>

            <div className={styles['yt-frame']}>
              <span className={`${styles['yt-bracket']} ${styles['is-tl']}`} aria-hidden />
              <span className={`${styles['yt-bracket']} ${styles['is-tr']}`} aria-hidden />
              <span className={`${styles['yt-bracket']} ${styles['is-bl']}`} aria-hidden />
              <span className={`${styles['yt-bracket']} ${styles['is-br']}`} aria-hidden />

              <YoutubeStage clip={current} reel={isReel} labels={labels} />

              {visible.length > 1 ? (
                <>
                  <button
                    type="button"
                    className={`${styles['yt-step']} ${styles['is-prev']}`}
                    onClick={() => step(-1)}
                    aria-label={ar ? 'السابق' : 'Previous'}
                  >
                    {ar ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                  </button>
                  <button
                    type="button"
                    className={`${styles['yt-step']} ${styles['is-next']}`}
                    onClick={() => step(1)}
                    aria-label={ar ? 'التالي' : 'Next'}
                  >
                    {ar ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Program Details */}
          <div className={styles['yt-program']}>
            <div className={styles['yt-chips']}>
              <span className={styles['yt-chip-channel']}>
                <CheckCircle2 size={13} className={styles['yt-chip-check']} aria-hidden />
                <b>{current.channelTitle}</b>
              </span>
              <span className={styles['yt-chip-lang']}>
                <Globe2 size={12} aria-hidden />
                {langLabel}
              </span>
              {typeof current.durationSec === 'number' && current.durationSec > 0 ? (
                <span className={styles['yt-chip-duration']}>
                  <Clock size={12} aria-hidden />
                  <time>{clock(current.durationSec)}</time>
                </span>
              ) : null}
              <span className={styles['yt-chip-date']}>
                <Calendar size={12} aria-hidden />
                <ClientTime
                  locale={locale}
                  value={current.publishedAt}
                  options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                />
              </span>
            </div>

            <h2 className={styles['yt-program-title']}>{current.title}</h2>

            <div className={styles['yt-program-actions']}>
              <a
                href={watchSrc(current.youtubeId, isReel)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['yt-watch-btn']}
              >
                <span className={styles['yt-play-icon-wrap']}>
                  <Play size={13} fill="currentColor" />
                </span>
                <span>{labels.watchOnYoutube}</span>
                <ExternalLink size={13} className={styles['yt-ext-icon']} />
              </a>

              <p className={styles['yt-source-note']}>
                <Radio size={12} aria-hidden />
                <span>
                  {labels.source} · {labels.youtube} · {labels.notLive}
                </span>
              </p>
            </div>
          </div>
        </section>

        {!isReel && queue.length > 1 ? (
          <aside className={styles['yt-queue']} aria-label={ar ? 'قائمة العرض' : 'Now playing'}>
            <header className={styles['yt-queue-head']}>
              <p>{ar ? 'الآن على الشاشة' : 'On screen'}</p>
              <h3>{ar ? 'قائمة العرض' : 'Programme'}</h3>
            </header>
            <ol className={styles['yt-queue-list']}>
              {queue.map((clip, index) => {
                const on = clip.youtubeId === current.youtubeId;
                return (
                  <li key={clip.youtubeId}>
                    <button
                      type="button"
                      className={`${styles['yt-queue-item']}${on ? ` ${styles['is-on']}` : ''}`}
                      onClick={() => show(clip.youtubeId)}
                      aria-pressed={on}
                    >
                      <span className={styles['yt-queue-num']}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={styles['yt-queue-thumb']}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={clip.thumbnailUrl || `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg`}
                          alt=""
                        />
                      </span>
                      <span className={styles['yt-queue-copy']}>
                        <b>{clip.title}</b>
                        <small>{clip.channelTitle}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}
      </div>

      {/* Video Shelf / Grid */}
      <section className={styles['yt-shelf']}>
        <header className={styles['yt-shelf-head']}>
          <div className={styles['yt-shelf-info']}>
            <div className={styles['yt-shelf-title-row']}>
              <Sparkles size={18} className={styles['yt-shelf-sparkle']} aria-hidden />
              <h3>{labels.shelf}</h3>
              <span className={styles['yt-shelf-count']}>{visible.length}</span>
            </div>
            <p>{labels.shelfLead}</p>
          </div>
        </header>

        <div className={styles['yt-tools']}>
          <div className={styles['yt-search-box']}>
            <Search size={16} className={styles['yt-search-icon']} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ar ? 'ابحث في مكتبة المقاطع أو القنوات…' : 'Search clips or channels…'}
              className={styles['yt-filter']}
            />
            {query ? (
              <button
                type="button"
                className={styles['yt-search-clear']}
                onClick={() => setQuery('')}
                aria-label={ar ? 'مسح البحث' : 'Clear search'}
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {channels.length > 1 ? (
            <div className={styles['yt-rail']} role="tablist" aria-label={ar ? 'تصفية بالقناة' : 'Filter by channel'}>
              <button
                type="button"
                className={`${styles['yt-channel-pill']}${channel === 'ALL' ? ` ${styles['is-on']}` : ''}`}
                onClick={() => setChannel('ALL')}
              >
                <span>{ar ? 'كل القنوات' : 'All channels'}</span>
                <span className={styles['yt-channel-count']}>{clips.length}</span>
              </button>
              {channels.map((item) => {
                const count = clips.filter((c) => c.channelId === item.id).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles['yt-channel-pill']}${channel === item.id ? ` ${styles['is-on']}` : ''}`}
                    onClick={() => setChannel(item.id)}
                  >
                    <span>{item.name}</span>
                    <span className={styles['yt-channel-count']}>{count}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className={styles['yt-empty-filter']}>
            <Search size={24} className={styles['yt-empty-icon']} />
            <p>{ar ? 'لا يوجد كليب يطابق هذا البحث في الرف الحالي.' : 'No clips match this filter on the current shelf.'}</p>
            <button
              type="button"
              className={styles['yt-reset-btn']}
              onClick={() => {
                setQuery('');
                setChannel('ALL');
              }}
            >
              {ar ? 'إعادة ضبط الفلتر' : 'Reset filters'}
            </button>
          </div>
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
                      loading="lazy"
                    />

                    <span className={styles['yt-poster-scrim']} aria-hidden />

                    {/* Hover Play Button */}
                    <span className={styles['yt-play-hover']} aria-hidden>
                      <Play size={18} fill="currentColor" />
                    </span>

                    {typeof clip.durationSec === 'number' && clip.durationSec > 0 ? (
                      <time className={styles['yt-duration-pill']}>{clock(clip.durationSec)}</time>
                    ) : null}

                    {on ? (
                      <span className={styles['yt-live-tag']}>
                        <span className={styles['yt-live-wave']} aria-hidden>
                          <span />
                          <span />
                          <span />
                        </span>
                        <span>{labels.nowPlaying}</span>
                      </span>
                    ) : null}
                  </span>

                  <span className={styles['yt-tile-copy']}>
                    <div className={styles['yt-tile-topline']}>
                      <span className={styles['yt-index']}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={styles['yt-tile-channel']}>{clip.channelTitle}</span>
                    </div>

                    <b className={styles['yt-tile-title']}>{clip.title}</b>

                    <div className={styles['yt-tile-meta']}>
                      <ClientTime
                        locale={locale}
                        value={clip.publishedAt}
                        options={{ day: 'numeric', month: 'short' }}
                      />
                    </div>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {archiveHref && archiveLabel ? (
        <div className={styles['yt-ticket-wrap']}>
          <Link href={archiveHref} className={styles['yt-ticket']}>
            <Archive size={17} className={styles['yt-ticket-icon']} />
            <div className={styles['yt-ticket-text']}>
              <strong>{archiveLabel}</strong>
              <small>{ar ? 'تصفّح المحتوى المؤرشف الكامل لجميع القنوات' : 'Browse full historical channel archives'}</small>
            </div>
            <span className={styles['yt-ticket-arrow']}>
              {ar ? '←' : '→'}
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
