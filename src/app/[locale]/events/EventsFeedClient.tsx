'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import styles from './events.module.css';
import { UnifiedEvent, SourceHealth, DataSourceStatus, EventCategory } from '@/lib/events/types';
import { Link } from '@/i18n/navigation';
import {
  Flame,
  Radio,
  Clock,
  RefreshCw,
  Search,
  ArrowUpRight,
  Zap,
  Trophy,
  Newspaper,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  ArrowRightLeft,
  Calendar,
} from 'lucide-react';

interface Props {
  locale: string;
  initialEvents: UnifiedEvent[];
  initialSources: SourceHealth[];
  initialTimeframe: 'today' | 'week' | 'month';
  initialType: string;
  initialLeague?: string;
  leagues: Array<{ id: string; name: string; slug: string }>;
}

export function EventsFeedClient({
  locale,
  initialEvents,
  initialSources,
  initialTimeframe,
  initialType,
  initialLeague,
  leagues,
}: Props) {
  const isAr = locale === 'ar';
  const [events, setEvents] = useState<UnifiedEvent[]>(initialEvents);
  const [sources, setSources] = useState<SourceHealth[]>(initialSources);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>(initialTimeframe);
  const [typeFilter, setTypeFilter] = useState<string>(initialType || 'all');
  const [leagueFilter, setLeagueFilter] = useState<string>(initialLeague || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();

  const fetchEvents = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('timeframe', timeframe);
      params.set('type', typeFilter);
      if (leagueFilter) params.set('league', leagueFilter);

      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        }
        if (Array.isArray(data.sources)) {
          setSources(data.sources);
        }
        setLastRefreshedAt(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setIsRefreshing(false);
      setCountdown(30);
    }
  }, [timeframe, typeFilter, leagueFilter]);

  // Auto-refresh timer countdown (30s)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchEvents();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchEvents]);

  // Handle manual filter switch
  const handleTypeChange = (newType: string) => {
    setTypeFilter(newType);
    startTransition(() => {
      fetchEvents();
    });
  };

  const handleTimeframeChange = (newTime: 'today' | 'week' | 'month') => {
    setTimeframe(newTime);
    startTransition(() => {
      fetchEvents();
    });
  };

  const handleLeagueChange = (newLeague: string) => {
    setLeagueFilter(newLeague);
    startTransition(() => {
      fetchEvents();
    });
  };

  // Client-side text search
  const filteredEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = ev.title.toLowerCase().includes(q);
    const subMatch = ev.subtitle?.toLowerCase().includes(q);
    const teamMatch =
      ev.details?.homeTeamName?.toLowerCase().includes(q) ||
      ev.details?.awayTeamName?.toLowerCase().includes(q) ||
      ev.details?.playerName?.toLowerCase().includes(q);
    return titleMatch || subMatch || teamMatch;
  });

  const getStatusBadge = (status: DataSourceStatus, count: number) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          icon: CheckCircle2,
          className: styles.statusAvailable,
          text: isAr ? `متاح (${count})` : `Active (${count})`,
        };
      case 'PENDING':
        return {
          icon: Clock,
          className: styles.statusPending,
          text: isAr ? `انتظار بيانات (${count})` : `Pending (${count})`,
        };
      case 'STALE':
        return {
          icon: AlertCircle,
          className: styles.statusStale,
          text: isAr ? 'بيانات قديمة' : 'Stale',
        };
      case 'UNAVAILABLE':
        return {
          icon: HelpCircle,
          className: styles.statusUnavailable,
          text: isAr ? 'غير مغطى حالياً' : 'Unavailable',
        };
      case 'ERROR':
        return {
          icon: XCircle,
          className: styles.statusError,
          text: isAr ? 'تعطل مؤقت' : 'Error',
        };
    }
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.badge}>
          <Flame className="h-4 w-4" />
          <span>{isAr ? 'الأجندة الرياضية والموجز الزمني الموحد' : 'Unified Sports Events Timeline'}</span>
        </div>
        <h1 className={styles.title}>
          {isAr ? 'الموجز الموحد للأحداث الرياضية المباشرة' : 'Live & Verified Sports Events Feed'}
        </h1>
        <p className={styles.subtitle}>
          {isAr
            ? 'موجز لحظي موحد يجمع المباريات المباشرة، مجريات اللقاءات والأهداف، الأخبار العاجلة، وسوق الانتقالات، من المصادر الرسمية المعتمدة.'
            : 'Consolidated real-time feed of live matches, in-game events, breaking news, and confirmed transfers from verified providers.'}
        </p>
      </header>

      {/* Source Health Monitor Section (Addresses: عند تعطل المصدر، لا تظهر عبارة «لا توجد أحداث» وكأن المصدر يعمل بصورة طبيعية) */}
      <section className={styles.sourceHealthSection}>
        <div className={styles.sourceHealthTitle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers className="h-4 w-4 text-emerald-500" />
            <span>{isAr ? 'حالة تغطية مصادر البيانات الموحدة:' : 'Unified Data Sources Health:'}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            {isAr
              ? `آخر تدقيق: ${lastRefreshedAt.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US')}`
              : `Last checked: ${lastRefreshedAt.toLocaleTimeString()}`}
          </span>
        </div>

        <div className={styles.sourcePillsList}>
          {sources.map((src, i) => {
            const badge = getStatusBadge(src.status, src.count);
            const Icon = badge.icon;
            return (
              <div
                key={i}
                className={`${styles.sourcePill} ${badge.className}`}
                title={src.message || src.name}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{src.name}: {badge.text}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Control Row: Search + Auto-refresh countdown */}
      <div className={styles.controlRow}>
        <div className={styles.searchWrap}>
          <Search className={`h-4 w-4 ${styles.searchIcon}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث سريع في الأحداث، الأندية، واللاعبين...' : 'Search events, teams, players...'}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.refreshControls}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={styles.refreshBtn}
            style={{
              borderColor: autoRefresh ? '#10b981' : undefined,
              color: autoRefresh ? '#059669' : undefined,
            }}
          >
            <Radio className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse text-emerald-500' : ''}`} />
            <span>
              {autoRefresh
                ? isAr ? `تحديث تلقائي (${countdown}ث)` : `Live (${countdown}s)`
                : isAr ? 'التحديث التلقائي متوقف' : 'Auto-refresh paused'}
            </span>
          </button>

          <button
            onClick={fetchEvents}
            disabled={isRefreshing}
            className={styles.refreshBtn}
            title={isAr ? 'تحديث فوري للبيانات' : 'Refresh Now'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث الآن' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Primary Category Filters (P0: الكل، مباشر، المباريات، الأخبار العاجلة، أحداث مهمة، الانتقالات) */}
      <div className={styles.filterPillsRow}>
        {[
          { key: 'all', labelAr: 'الكل', labelEn: 'All Events', icon: Layers },
          { key: 'live', labelAr: '🔴 مباشر الآن', labelEn: '🔴 Live Now', icon: Radio },
          { key: 'matches', labelAr: '⚽ المباريات وأحداثها', labelEn: '⚽ Match Events', icon: Trophy },
          { key: 'news', labelAr: '📰 الأخبار العاجلة', labelEn: '📰 Breaking News', icon: Newspaper },
          { key: 'major', labelAr: '🏆 قمم وأحداث مهمة', labelEn: '🏆 Big Clashes', icon: Flame },
          { key: 'transfers', labelAr: '🔄 الانتقالات', labelEn: '🔄 Transfers', icon: ArrowRightLeft },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = typeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTypeChange(tab.key)}
              className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
            >
              <Icon className="h-4 w-4" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Timeframe & Tournament Filters */}
      <div className={styles.timeframeRow}>
        <span className={styles.timeLabel}>
          <Clock className="h-3.5 w-3.5" />
          <span>{isAr ? 'الفترة:' : 'Timeframe:'}</span>
        </span>
        <button
          onClick={() => handleTimeframeChange('today')}
          className={`${styles.chip} ${timeframe === 'today' ? styles.chipActive : ''}`}
        >
          {isAr ? 'اليوم' : 'Today'}
        </button>
        <button
          onClick={() => handleTimeframeChange('week')}
          className={`${styles.chip} ${timeframe === 'week' ? styles.chipActive : ''}`}
        >
          {isAr ? 'الأسبوع الحالي' : 'This Week'}
        </button>
        <button
          onClick={() => handleTimeframeChange('month')}
          className={`${styles.chip} ${timeframe === 'month' ? styles.chipActive : ''}`}
        >
          {isAr ? 'الشهر القادم' : 'Next 30 Days'}
        </button>

        {leagues.length > 0 && (
          <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={styles.timeLabel}>
              <Trophy className="h-3.5 w-3.5 text-blue-500" />
              <span>{isAr ? 'تصفية بالبطولة:' : 'Tournament:'}</span>
            </span>
            <select
              value={leagueFilter}
              onChange={(e) => handleLeagueChange(e.target.value)}
              className={styles.searchInput}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="">{isAr ? 'كافة البطولات' : 'All Tournaments'}</option>
              {leagues.map((lg) => (
                <option key={lg.id} value={lg.slug}>
                  {lg.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Unified Timeline Grid */}
      {filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0' }}>
            {isAr ? 'لا توجد أحداث مطابقة للفلاتر المحددة' : 'No matching events found'}
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
            {isAr
              ? 'البيانات المعروضة مستخرجة حصرياً من المصادر الفعلية المعتمدة للمباريات والأخبار والصفقات دون اختراع أي أحداث غير مؤكدة.'
              : 'Data is strictly synchronized with verified real-time providers without synthetic fixtures.'}
          </p>
          <button
            onClick={() => {
              setTypeFilter('all');
              setTimeframe('week');
              setLeagueFilter('');
              setSearchQuery('');
            }}
            className={styles.refreshBtn}
            style={{ margin: '0 auto' }}
          >
            {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className={styles.timelineGrid}>
          {filteredEvents.map((ev) => {
            const hasScore = ev.details?.homeScore !== null && ev.details?.awayScore !== null;
            const isLive = ev.type === 'LIVE';

            return (
              <article key={ev.id} className={styles.eventCard}>
                <div>
                  <div className={styles.cardTop}>
                    <span
                      className={styles.cardBadge}
                      style={{ background: ev.badge.color }}
                    >
                      {ev.badge.isPulse && (
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      )}
                      <span>{isAr ? ev.badge.text : ev.badge.textEn}</span>
                    </span>

                    <span className={styles.cardTime}>
                      {new Date(ev.timestamp).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{ev.title}</h3>
                  {ev.subtitle && <p className={styles.cardSubtitle}>{ev.subtitle}</p>}

                  {/* Match / Live Clash Layout */}
                  {(ev.type === 'LIVE' || ev.type === 'MAJOR_EVENT' || ev.type === 'MATCH_EVENT') && (
                    <div className={styles.clashRow}>
                      <div className={styles.teamCol}>
                        {ev.media?.crestHome ? (
                          <img src={ev.media.crestHome} alt="Home crest" className={styles.crestImg} />
                        ) : (
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--muted)' }} />
                        )}
                        <span className={styles.teamNameText}>
                          {ev.details?.homeTeamName || 'فريق'}
                        </span>
                      </div>

                      <div className={styles.scoreCol}>
                        {hasScore ? (
                          <span style={{ color: isLive ? '#ef4444' : undefined }}>
                            {ev.details?.homeScore} - {ev.details?.awayScore}
                          </span>
                        ) : isLive ? (
                          <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                            {ev.minute ? `${ev.minute}′` : (isAr ? 'مباشر' : 'LIVE')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>VS</span>
                        )}
                      </div>

                      <div className={styles.teamCol} style={{ justifyContent: 'flex-end' }}>
                        <span className={styles.teamNameText}>
                          {ev.details?.awayTeamName || 'فريق'}
                        </span>
                        {ev.media?.crestAway ? (
                          <img src={ev.media.crestAway} alt="Away crest" className={styles.crestImg} />
                        ) : (
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--muted)' }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* News Featured Image */}
                  {ev.type === 'NEWS' && ev.media?.image && (
                    <div className={styles.newsImgWrap}>
                      <img src={ev.media.image} alt={ev.title} className={styles.newsImg} loading="lazy" />
                    </div>
                  )}
                </div>

                {/* Footer with Deep Linking */}
                <div className={styles.cardFooter}>
                  <span className={styles.sourceTag} title={ev.sourceName}>
                    {ev.sourceName}
                  </span>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {ev.links.match && (
                      <Link href={ev.links.match} className={styles.cardActionBtn}>
                        <span>{isAr ? 'مركز المباراة' : 'Match Center'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {ev.links.news && (
                      <Link href={ev.links.news} className={styles.cardActionBtn}>
                        <span>{isAr ? 'قراءة الخبر' : 'Read Article'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {ev.links.player && (
                      <Link href={ev.links.player} className={styles.cardActionBtn}>
                        <span>{isAr ? 'ملف اللاعب' : 'Player Profile'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {ev.links.transfer && (
                      <Link href={ev.links.transfer} className={styles.cardActionBtn}>
                        <span>{isAr ? 'سوق الانتقالات' : 'Transfers'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
