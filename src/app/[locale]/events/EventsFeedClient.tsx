'use client';

import React, { useState, useEffect, useTransition, useCallback, useMemo, useRef } from 'react';
import styles from './events.module.css';
import { UnifiedEvent, SourceHealth, DataSourceStatus } from '@/lib/events/types';
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
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Check,
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
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const [isLeagueOpen, setIsLeagueOpen] = useState(false);
  const [leagueSearch, setLeagueSearch] = useState('');
  const leagueDropdownRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (leagueDropdownRef.current && !leagueDropdownRef.current.contains(event.target as Node)) {
        setIsLeagueOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Polling data fetcher
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

  // Auto-refresh timer countdown (30s interval)
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

  // Trigger fetch on filter change
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

  // Metrics counts
  const metrics = useMemo(() => {
    let live = 0;
    let matchEvents = 0;
    let news = 0;
    let transfers = 0;
    for (const ev of events) {
      if (ev.type === 'LIVE') live++;
      else if (ev.type === 'MATCH_EVENT') matchEvents++;
      else if (ev.type === 'NEWS') news++;
      else if (ev.type === 'TRANSFER') transfers++;
    }
    return { live, matchEvents, news, transfers, total: events.length };
  }, [events]);

  // Client-side text search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter((ev) => {
      const titleMatch = ev.title.toLowerCase().includes(q);
      const subMatch = ev.subtitle?.toLowerCase().includes(q);
      const teamMatch =
        ev.details?.homeTeamName?.toLowerCase().includes(q) ||
        ev.details?.awayTeamName?.toLowerCase().includes(q) ||
        ev.details?.playerName?.toLowerCase().includes(q) ||
        ev.details?.leagueName?.toLowerCase().includes(q);
      return titleMatch || subMatch || teamMatch;
    });
  }, [events, searchQuery]);

  const selectedLeagueName = useMemo(() => {
    if (!leagueFilter) return isAr ? 'كافة البطولات والدوريات' : 'All Competitions';
    const found = leagues.find((lg) => lg.slug === leagueFilter);
    return found ? found.name : isAr ? 'كافة البطولات والدوريات' : 'All Competitions';
  }, [leagueFilter, leagues, isAr]);

  const filteredLeagues = useMemo(() => {
    if (!leagueSearch.trim()) return leagues;
    const q = leagueSearch.toLowerCase().trim();
    return leagues.filter((lg) => lg.name.toLowerCase().includes(q));
  }, [leagues, leagueSearch]);

  // Format date helper
  const formatEventTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatEventDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return isAr ? 'اليوم' : 'Today';
      }
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: DataSourceStatus, count: number) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          icon: CheckCircle2,
          className: styles.statusAvailable,
          text: isAr ? `نشط (${count})` : `Active (${count})`,
        };
      case 'PENDING':
        return {
          icon: Clock,
          className: styles.statusPending,
          text: isAr ? `مستمر (${count})` : `Syncing (${count})`,
        };
      case 'STALE':
        return {
          icon: AlertCircle,
          className: styles.statusStale,
          text: isAr ? 'محدث' : 'Stale',
        };
      case 'UNAVAILABLE':
        return {
          icon: HelpCircle,
          className: styles.statusUnavailable,
          text: isAr ? 'غير مشمول' : 'Unavailable',
        };
      case 'ERROR':
        return {
          icon: XCircle,
          className: styles.statusError,
          text: isAr ? 'تأخر مؤقت' : 'Error',
        };
    }
  };

  return (
    <div className={styles.page}>
      {/* Ambient background glow */}
      <div className={styles.glowAura} />

      {/* Hero Header */}
      <header className={styles.header}>
        <div className={styles.livePulsePill}>
          <span className={styles.liveBeacon}>
            <span className={styles.beaconPing} />
            <span className={styles.beaconDot} />
          </span>
          <span>{isAr ? 'رادار الأحداث الرياضية المباشر' : 'Live Sports Events Radar'}</span>
          <span className={styles.pillDivider}>•</span>
          <span className={styles.livePulseText}>
            {isAr ? 'بيانات حية وموثقة 100%' : '100% Real-Time & Verified'}
          </span>
        </div>

        <h1 className={styles.title}>
          {isAr ? 'الموجز الزمني الموحد للأحداث الرياضية' : 'Unified Sports Events Timeline'}
        </h1>
        <p className={styles.subtitle}>
          {isAr
            ? 'تغطية شاملة لحظة بلحظة تجمع المباريات الجارية، الأهداف الحاسمة، البطاقات، الأخبار العاجلة، وصفقات الانتقالات المعتمدة من المصادر الرسمية.'
            : 'Comprehensive real-time coverage aggregating live matches, game incidents, breaking headlines, and confirmed transfer deals.'}
        </p>

        {/* Dynamic Metric Cards Bar */}
        <div className={styles.metricsBar}>
          <button
            onClick={() => handleTypeChange('all')}
            className={`${styles.metricCard} ${typeFilter === 'all' ? styles.metricCardActive : ''}`}
          >
            <div className={styles.metricIconWrap} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Zap className="h-4 w-4" />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricVal}>{metrics.total}</span>
              <span className={styles.metricLabel}>{isAr ? 'إجمالي الأحداث' : 'Total Events'}</span>
            </div>
          </button>

          <button
            onClick={() => handleTypeChange('live')}
            className={`${styles.metricCard} ${typeFilter === 'live' ? styles.metricCardActive : ''}`}
          >
            <div className={styles.metricIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div className={styles.metricInfo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className={styles.metricVal} style={{ color: '#ef4444' }}>{metrics.live}</span>
                {metrics.live > 0 && <span className={styles.activeDot} />}
              </div>
              <span className={styles.metricLabel}>{isAr ? 'مباشر الآن' : 'Live Now'}</span>
            </div>
          </button>

          <button
            onClick={() => handleTypeChange('matches')}
            className={`${styles.metricCard} ${typeFilter === 'matches' ? styles.metricCardActive : ''}`}
          >
            <div className={styles.metricIconWrap} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Trophy className="h-4 w-4" />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricVal}>{metrics.matchEvents}</span>
              <span className={styles.metricLabel}>{isAr ? 'أحداث المباريات' : 'Match Incidents'}</span>
            </div>
          </button>

          <button
            onClick={() => handleTypeChange('news')}
            className={`${styles.metricCard} ${typeFilter === 'news' ? styles.metricCardActive : ''}`}
          >
            <div className={styles.metricIconWrap} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Newspaper className="h-4 w-4" />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricVal}>{metrics.news}</span>
              <span className={styles.metricLabel}>{isAr ? 'الأخبار العاجلة' : 'Breaking News'}</span>
            </div>
          </button>

          <button
            onClick={() => handleTypeChange('transfers')}
            className={`${styles.metricCard} ${typeFilter === 'transfers' ? styles.metricCardActive : ''}`}
          >
            <div className={styles.metricIconWrap} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricVal}>{metrics.transfers}</span>
              <span className={styles.metricLabel}>{isAr ? 'سوق الانتقالات' : 'Transfers'}</span>
            </div>
          </button>
        </div>
      </header>

      {/* Sources Health Strip (Collapsible, Sleek) */}
      <section className={styles.sourceHealthContainer}>
        <div
          className={styles.sourceHealthHeader}
          onClick={() => setShowSourcesPanel(!showSourcesPanel)}
          role="button"
          tabIndex={0}
        >
          <div className={styles.sourceHealthLeft}>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className={styles.sourceHealthStatusText}>
              {isAr ? 'حالة التغطية وتكامل البيانات:' : 'Data Integrity & Coverage:'}
            </span>
            <span className={styles.sourceHealthCountBadge}>
              {sources.length} {isAr ? 'مصادر متصلة' : 'Connected Providers'}
            </span>
          </div>

          <div className={styles.sourceHealthRight}>
            <span className={styles.lastCheckedText}>
              <Clock className="h-3 w-3" />
              {isAr
                ? `آخر مزامنة: ${lastRefreshedAt.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US')}`
                : `Synced: ${lastRefreshedAt.toLocaleTimeString()}`}
            </span>
            {showSourcesPanel ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {showSourcesPanel && (
          <div className={styles.sourcePillsGrid}>
            {sources.map((src, i) => {
              const badge = getStatusBadge(src.status, src.count);
              const Icon = badge.icon;
              return (
                <div key={i} className={`${styles.sourcePillCard} ${badge.className}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className={styles.sourcePillName}>{src.name}</span>
                  </div>
                  <span className={styles.sourcePillState}>{badge.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Control Action Toolbar: Search + Auto-Refresh */}
      <div className={styles.actionToolbar}>
        {/* Search Input with Clear Button */}
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث في الأحداث، الأندية، اللاعبين، أو البطولات...'
                : 'Search events, clubs, players, leagues...'
            }
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchBtn}
              title={isAr ? 'مسح البحث' : 'Clear search'}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Live Controls */}
        <div className={styles.liveControls}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`${styles.toggleAutoBtn} ${autoRefresh ? styles.toggleAutoActive : ''}`}
            title={isAr ? 'تشغيل أو إيقاف المزامنة اللحظية' : 'Toggle live sync'}
          >
            <Radio className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span>
              {autoRefresh
                ? isAr
                  ? `مزامنة حية (${countdown}ث)`
                  : `Live Sync (${countdown}s)`
                : isAr
                ? 'المزامنة متوقفة'
                : 'Sync Paused'}
            </span>
          </button>

          <button
            onClick={fetchEvents}
            disabled={isRefreshing}
            className={styles.manualRefreshBtn}
            title={isAr ? 'تحديث فوري للبيانات' : 'Refresh Now'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Primary Category Filter Tabs (Swipeable on Mobile) */}
      <div className={styles.categoryTabsContainer}>
        <div className={styles.categoryTabsTrack}>
          {[
            { key: 'all', labelAr: 'الكل', labelEn: 'All Events', icon: Layers, count: metrics.total },
            { key: 'live', labelAr: '🔴 مباشر الآن', labelEn: '🔴 Live Now', icon: Radio, count: metrics.live },
            { key: 'matches', labelAr: '⚽ المباريات وأحداثها', labelEn: '⚽ Match Events', icon: Trophy, count: metrics.matchEvents },
            { key: 'news', labelAr: '📰 الأخبار العاجلة', labelEn: '📰 Breaking News', icon: Newspaper, count: metrics.news },
            { key: 'major', labelAr: '🏆 قمم ومواعيد', labelEn: '🏆 Big Clashes', icon: Flame },
            { key: 'transfers', labelAr: '🔄 صفقات الانتقالات', labelEn: '🔄 Transfers', icon: ArrowRightLeft, count: metrics.transfers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = typeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTypeChange(tab.key)}
                className={`${styles.categoryTab} ${active ? styles.categoryTabActive : ''}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={styles.tabCounter}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Timeframe & Tournament Filter Row */}
      <div className={styles.filterSubBar}>
        <div className={styles.timeframeGroup}>
          <span className={styles.filterLabel}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{isAr ? 'النطاق الزمني:' : 'Timeframe:'}</span>
          </span>
          <button
            onClick={() => handleTimeframeChange('today')}
            className={`${styles.timeChip} ${timeframe === 'today' ? styles.timeChipActive : ''}`}
          >
            {isAr ? 'اليوم' : 'Today'}
          </button>
          <button
            onClick={() => handleTimeframeChange('week')}
            className={`${styles.timeChip} ${timeframe === 'week' ? styles.timeChipActive : ''}`}
          >
            {isAr ? 'الأسبوع الحالي' : 'This Week'}
          </button>
          <button
            onClick={() => handleTimeframeChange('month')}
            className={`${styles.timeChip} ${timeframe === 'month' ? styles.timeChipActive : ''}`}
          >
            {isAr ? 'الشهر' : 'Month'}
          </button>
        </div>

        {leagues.length > 0 && (
          <div className={styles.tournamentGroup} ref={leagueDropdownRef}>
            <span className={styles.filterLabel}>
              <Trophy className="h-3.5 w-3.5 text-blue-500" />
              <span>{isAr ? 'البطولة:' : 'Tournament:'}</span>
            </span>

            <div className={styles.tournamentDropdownWrap}>
              <button
                type="button"
                onClick={() => setIsLeagueOpen(!isLeagueOpen)}
                className={`${styles.tournamentDropdownBtn} ${isLeagueOpen ? styles.tournamentDropdownBtnOpen : ''}`}
                aria-expanded={isLeagueOpen}
              >
                <span className={styles.selectedLeagueText} title={selectedLeagueName}>
                  {selectedLeagueName}
                </span>
                <ChevronDown
                  className={`${styles.dropdownChevron} ${isLeagueOpen ? styles.dropdownChevronRotate : ''}`}
                />
              </button>

              {isLeagueOpen && (
                <div className={styles.tournamentDropdownMenu}>
                  {leagues.length > 6 && (
                    <div className={styles.dropdownSearchWrap}>
                      <input
                        type="text"
                        value={leagueSearch}
                        onChange={(e) => setLeagueSearch(e.target.value)}
                        placeholder={isAr ? 'ابحث عن بطولة...' : 'Search tournament...'}
                        className={styles.dropdownSearchInput}
                        autoFocus
                      />
                    </div>
                  )}

                  <div className={styles.dropdownList}>
                    <button
                      type="button"
                      onClick={() => {
                        handleLeagueChange('');
                        setIsLeagueOpen(false);
                        setLeagueSearch('');
                      }}
                      className={`${styles.dropdownItem} ${!leagueFilter ? styles.dropdownItemActive : ''}`}
                    >
                      <span>{isAr ? 'كافة البطولات والدوريات' : 'All Competitions'}</span>
                      {!leagueFilter && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                    </button>

                    {filteredLeagues.map((lg) => {
                      const isSelected = leagueFilter === lg.slug;
                      return (
                        <button
                          key={lg.id}
                          type="button"
                          onClick={() => {
                            handleLeagueChange(lg.slug);
                            setIsLeagueOpen(false);
                            setLeagueSearch('');
                          }}
                          className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemActive : ''}`}
                        >
                          <span className={styles.leagueItemName}>{lg.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        </button>
                      );
                    })}

                    {filteredLeagues.length === 0 && (
                      <div className={styles.dropdownEmptyText}>
                        {isAr ? 'لا توجد بطولة بهذا الاسم' : 'No tournaments match'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search results banner if searching */}
      {searchQuery && (
        <div className={styles.searchFeedback}>
          <span>
            {isAr
              ? `نتائج البحث عن «${searchQuery}»: ${filteredEvents.length} حدث`
              : `Found ${filteredEvents.length} event(s) for "${searchQuery}"`}
          </span>
          <button onClick={() => setSearchQuery('')} className={styles.resetSearchLink}>
            {isAr ? 'إلغاء التصفية' : 'Clear search'}
          </button>
        </div>
      )}

      {/* Unified Timeline Grid */}
      {filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className={styles.emptyTitle}>
            {isAr ? 'لا توجد أحداث مطابقة في هذا النطاق' : 'No matching events found'}
          </h3>
          <p className={styles.emptyDesc}>
            {isAr
              ? 'البيانات المعروضة مستمدة بدقة وبشكل لحظي من مصادر المباريات والصفقات والأخبار المعتمدة دون توليد أحداث افتراضية غير حقيقية.'
              : 'All timeline items are strictly synchronized with verified sports providers without synthetic fixtures.'}
          </p>
          <button
            onClick={() => {
              setTypeFilter('all');
              setTimeframe('week');
              setLeagueFilter('');
              setSearchQuery('');
            }}
            className={styles.resetFiltersBtn}
          >
            <Sparkles className="h-4 w-4" />
            <span>{isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset All Filters'}</span>
          </button>
        </div>
      ) : (
        <div className={styles.timelineGrid}>
          {filteredEvents.map((ev) => {
            const hasScore = ev.details?.homeScore !== null && ev.details?.awayScore !== null;
            const isLive = ev.type === 'LIVE';
            const isFinished = ev.details?.matchStatus === 'FINISHED';
            const isMatchRelated = ev.type === 'LIVE' || ev.type === 'MAJOR_EVENT';
            const isIncident = ev.type === 'MATCH_EVENT';
            const isNews = ev.type === 'NEWS';
            const isTransfer = ev.type === 'TRANSFER';

            return (
              <article
                key={ev.id}
                className={`${styles.eventCard} ${isLive ? styles.eventCardLive : ''}`}
              >
                {/* Card Top: Category Badge + Timestamp */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardBadgeWrap}>
                    <span
                      className={styles.cardBadge}
                      style={{ background: ev.badge.color }}
                    >
                      {ev.badge.isPulse && (
                        <span className={styles.badgePulseDot} />
                      )}
                      <span>{isAr ? ev.badge.text : ev.badge.textEn}</span>
                    </span>

                    {ev.details?.leagueName && (
                      <span className={styles.leagueNameTag}>
                        {ev.details.leagueName}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardTimeWrap}>
                    <span className={styles.cardTimeDate}>{formatEventDate(ev.timestamp)}</span>
                    <span className={styles.cardTimeClock}>{formatEventTime(ev.timestamp)}</span>
                  </div>
                </div>

                {/* Match Card Layout (Live & Upcoming / Finished Clashes) */}
                {isMatchRelated && (
                  <div className={styles.matchArena}>
                    <div className={styles.clashTeamsRow}>
                      {/* Home Team */}
                      <div className={styles.clashTeamSide}>
                        {ev.media?.crestHome ? (
                          <img
                            src={ev.media.crestHome}
                            alt={ev.details?.homeTeamName || 'Home'}
                            className={styles.clashCrest}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.crestPlaceholder}>⚽</div>
                        )}
                        <span className={styles.clashTeamName} title={ev.details?.homeTeamName}>
                          {ev.details?.homeTeamName || 'فريق'}
                        </span>
                      </div>

                      {/* Scoreboard / Center VS */}
                      <div className={styles.clashCenterBox}>
                        {hasScore ? (
                          <div className={styles.scoreContainer}>
                            <span
                              className={`${styles.scoreNumber} ${
                                isLive ? styles.scoreLive : isFinished ? styles.scoreFinished : ''
                              }`}
                            >
                              {ev.details?.homeScore} : {ev.details?.awayScore}
                            </span>
                            <span className={styles.scoreStatusLabel}>
                              {isLive
                                ? ev.minute
                                  ? `${ev.minute}′`
                                  : isAr
                                  ? 'مباشر'
                                  : 'LIVE'
                                : isFinished
                                ? isAr
                                  ? 'نهاية المباراة'
                                  : 'FT'
                                : ''}
                            </span>
                          </div>
                        ) : (
                          <div className={styles.upcomingTimeBox}>
                            <span className={styles.vsBadge}>VS</span>
                            <span className={styles.kickoffTimeSub}>
                              {formatEventTime(ev.timestamp)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className={`${styles.clashTeamSide} ${styles.clashTeamSideAway}`}>
                        {ev.media?.crestAway ? (
                          <img
                            src={ev.media.crestAway}
                            alt={ev.details?.awayTeamName || 'Away'}
                            className={styles.clashCrest}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.crestPlaceholder}>⚽</div>
                        )}
                        <span className={styles.clashTeamName} title={ev.details?.awayTeamName}>
                          {ev.details?.awayTeamName || 'فريق'}
                        </span>
                      </div>
                    </div>

                    {ev.details?.venue && (
                      <div className={styles.matchVenueRow}>
                        <span className={styles.venueText}>📍 {ev.details.venue}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Match Incident Layout (Goals, Red Cards, Subs) */}
                {isIncident && (
                  <div className={styles.incidentLayout}>
                    <div className={styles.incidentMain}>
                      <div className={styles.incidentPlayerWrap}>
                        {ev.details?.playerPhoto ? (
                          <img
                            src={ev.details.playerPhoto}
                            alt={ev.details.playerName || 'Player'}
                            className={styles.incidentPlayerPhoto}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.incidentPlayerAvatar}>
                            {ev.badge.text.includes('هدف') ? '⚽' : ev.badge.text.includes('حمراء') ? '🟥' : '🟨'}
                          </div>
                        )}
                        <div className={styles.incidentInfo}>
                          <h4 className={styles.incidentTitle}>{ev.title}</h4>
                          {ev.subtitle && <p className={styles.incidentSubtitle}>{ev.subtitle}</p>}
                        </div>
                      </div>

                      {ev.minute && (
                        <div className={styles.minuteBadge}>
                          <Clock className="h-3 w-3" />
                          <span>{ev.minute}′</span>
                        </div>
                      )}
                    </div>

                    {/* Match Context Pill */}
                    <div className={styles.incidentMatchContext}>
                      <div className={styles.incidentTeamsSmall}>
                        {ev.media?.crestHome && (
                          <img src={ev.media.crestHome} alt="" className={styles.miniCrest} />
                        )}
                        <span>{ev.details?.homeTeamName}</span>
                        <span className={styles.miniScore}>
                          {ev.details?.homeScore ?? 0} - {ev.details?.awayScore ?? 0}
                        </span>
                        <span>{ev.details?.awayTeamName}</span>
                        {ev.media?.crestAway && (
                          <img src={ev.media.crestAway} alt="" className={styles.miniCrest} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* News Card Layout */}
                {isNews && (
                  <div className={styles.newsLayout}>
                    {ev.media?.image && (
                      <div className={styles.newsCoverWrap}>
                        <img
                          src={ev.media.image}
                          alt={ev.title}
                          className={styles.newsCover}
                          loading="lazy"
                        />
                        <div className={styles.newsGradientOverlay} />
                      </div>
                    )}
                    <h3 className={styles.newsTitle}>{ev.title}</h3>
                    {ev.subtitle && <p className={styles.newsExcerpt}>{ev.subtitle}</p>}
                  </div>
                )}

                {/* Transfer Deal Layout */}
                {isTransfer && (
                  <div className={styles.transferLayout}>
                    <div className={styles.transferHeader}>
                      <span className={styles.transferDealBadge}>
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>{isAr ? 'صفقة انتقال رسمية' : 'Verified Deal'}</span>
                      </span>
                      {ev.details?.fee && (
                        <span className={styles.transferFeePill}>{ev.details.fee}</span>
                      )}
                    </div>

                    <div className={styles.transferPipeline}>
                      {/* From Team */}
                      <div className={styles.transferClub}>
                        {ev.media?.crestHome ? (
                          <img src={ev.media.crestHome} alt="" className={styles.transferCrest} />
                        ) : (
                          <div className={styles.transferClubIcon}>🛡️</div>
                        )}
                        <span className={styles.transferClubName}>
                          {ev.details?.fromTeam || (isAr ? 'نادي سابق' : 'Previous Club')}
                        </span>
                      </div>

                      {/* Direction Arrow */}
                      <div className={styles.transferArrowBox}>
                        <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
                      </div>

                      {/* To Team */}
                      <div className={styles.transferClub}>
                        {ev.media?.crestAway ? (
                          <img src={ev.media.crestAway} alt="" className={styles.transferCrest} />
                        ) : (
                          <div className={styles.transferClubIcon}>🛡️</div>
                        )}
                        <span className={styles.transferClubName}>
                          {ev.details?.toTeam || (isAr ? 'النادي الجديد' : 'New Club')}
                        </span>
                      </div>
                    </div>

                    <div className={styles.transferPlayerBar}>
                      <span className={styles.transferPlayerName}>
                        {ev.details?.playerName || ev.title}
                      </span>
                    </div>
                  </div>
                )}

                {/* Universal Card Footer: Source verification & Action link */}
                <div className={styles.cardFooter}>
                  <div className={styles.sourceTagWrap}>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className={styles.sourceTagText} title={ev.sourceName}>
                      {ev.sourceName}
                    </span>
                  </div>

                  <div className={styles.cardActions}>
                    {ev.links.match && (
                      <Link href={ev.links.match} className={styles.primaryActionBtn}>
                        <span>{isAr ? 'مركز المباراة' : 'Match Center'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {ev.links.news && (
                      <Link href={ev.links.news} className={styles.primaryActionBtn}>
                        <span>{isAr ? 'تفاصيل الخبر' : 'Full Story'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {ev.links.player && !ev.links.match && (
                      <Link href={ev.links.player} className={styles.primaryActionBtn}>
                        <span>{isAr ? 'بروفايل اللاعب' : 'Profile'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {ev.links.transfer && !ev.links.match && !ev.links.news && (
                      <Link href={ev.links.transfer} className={styles.primaryActionBtn}>
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
