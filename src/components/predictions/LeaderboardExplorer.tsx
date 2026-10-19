'use client';

import { reportCaughtError } from '@/lib/ops/caught';
import { useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Trophy,
  Medal,
  Search,
  Mic,
  X,
  Sparkles,
} from 'lucide-react';
import styles from './predictions-house.module.css';

export interface UserRankItem {
  id: string;
  name: string | null;
  image: string | null;
  points: number;
  predictionsCount: number;
  rank: number;
}

export interface RealScorerItem {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  teamName?: string;
  goals: number;
  leagueName: string;
  rank: number;
}

interface LeaderboardExplorerProps {
  userRanks: UserRankItem[];
  realScorers: RealScorerItem[];
  currentUserId?: string | null;
  locale: string;
  labels: {
    searchPlaceholder: string;
    voiceListening: string;
    voiceUnsupported: string;
    tabUsers: string;
    tabScorers: string;
    colRank: string;
    colName: string;
    colPredictions: string;
    colPoints: string;
    colGoals: string;
    colTeam: string;
    colLeague: string;
    emptyMessage: string;
    clearSearch: string;
    you: string;
    allLeagues: string;
  };
}

function initials(name: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function LeaderboardExplorer({
  userRanks,
  realScorers,
  currentUserId,
  locale,
  labels,
}: LeaderboardExplorerProps) {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'users' | 'scorers'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const recognitionRef = useRef<any>(null);

  const leagues = useMemo(() => {
    const list = Array.from(new Set(realScorers.map((s) => s.leagueName))).filter(Boolean);
    return ['ALL', ...list];
  }, [realScorers]);

  const toggleVoiceSearch = () => {
    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      setSpeechError(labels.voiceUnsupported);
      setTimeout(() => setSpeechError(null), 3500);
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) setSearchQuery(transcript.trim());
        setIsListening(false);
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setSpeechError(labels.voiceUnsupported);
          setTimeout(() => setSpeechError(null), 3500);
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      reportCaughtError('src/components/predictions/LeaderboardExplorer.tsx:voice', err, {
        persist: false,
      });
      setIsListening(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return userRanks;
    const query = searchQuery.toLowerCase().trim();
    return userRanks.filter((u) => (u.name || '').toLowerCase().includes(query));
  }, [userRanks, searchQuery]);

  const filteredScorers = useMemo(() => {
    let list = realScorers;
    if (selectedLeague !== 'ALL') list = list.filter((s) => s.leagueName === selectedLeague);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.teamName || '').toLowerCase().includes(query) ||
          s.leagueName.toLowerCase().includes(query),
      );
    }
    return list;
  }, [realScorers, selectedLeague, searchQuery]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className={styles.goldMedalPill}>
          <span>🥇</span>
          <b>01</b>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className={styles.silverMedalPill}>
          <span>🥈</span>
          <b>02</b>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className={styles.bronzeMedalPill}>
          <span>🥉</span>
          <b>03</b>
        </span>
      );
    }
    return <span className={styles.normalRankPill}>#{String(rank).padStart(2, '0')}</span>;
  };

  const getTierTag = (rank: number) => {
    if (rank === 1) return isAr ? 'بطل الصدارة' : 'Leader';
    if (rank <= 3) return isAr ? 'منصة التتويج' : 'Podium';
    if (rank <= 10) return isAr ? 'خبير تكتيكي' : 'Expert';
    return null;
  };

  return (
    <div className={styles.lx}>
      {/* Explorer Controls: Structured Tab Strip & Search Bar */}
      <div className={styles.lxToolbar}>
        {/* Navigation Tabs */}
        <div className={styles['lx-tabs']}>
          <button
            type="button"
            data-on={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            className={styles.tabBtn}
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>{labels.tabUsers}</span>
            <i className={styles.countTag}>{userRanks.length}</i>
          </button>
          <button
            type="button"
            data-on={activeTab === 'scorers'}
            onClick={() => setActiveTab('scorers')}
            className={styles.tabBtn}
          >
            <Medal className="h-4 w-4 text-emerald-500" />
            <span>{labels.tabScorers}</span>
            <i className={styles.countTag}>{realScorers.length}</i>
          </button>
        </div>

        {/* Clean Integrated Search Bar */}
        <div className={styles['lx-seek']}>
          <Search className={styles.searchIconInside} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isListening ? labels.voiceListening : labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className={styles.searchInput}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title={labels.clearSearch}
              className={styles.searchClearBtn}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleVoiceSearch}
              title={labels.searchPlaceholder}
              className={`${styles.voiceBtn} ${isListening ? styles.isVoiceListening : ''}`}
            >
              <Mic className="h-4 w-4" />
            </button>
          )}

          {/* Non-intrusive Floating Toast Error */}
          {speechError && (
            <div className={styles.speechErrorTooltip}>
              <span>{speechError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scorers League Filter Pills */}
      {activeTab === 'scorers' && leagues.length > 2 ? (
        <div className={styles['lx-leagues']}>
          {leagues.map((lg) => (
            <button
              key={lg}
              type="button"
              data-on={selectedLeague === lg}
              onClick={() => setSelectedLeague(lg)}
              className={styles.leagueFilterBtn}
            >
              {lg === 'ALL' ? labels.allLeagues : lg}
            </button>
          ))}
        </div>
      ) : null}

      {/* Users Leaderboard Table */}
      {activeTab === 'users' ? (
        filteredUsers.length === 0 ? (
          <div className={styles['ph-empty']}>
            <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p>{labels.emptyMessage}</p>
          </div>
        ) : (
          <div className={styles['lx-table']}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>{labels.colRank}</th>
                  <th>{labels.colName}</th>
                  <th style={{ textAlign: 'center' }}>{labels.colPredictions}</th>
                  <th style={{ textAlign: 'end' }}>{labels.colPoints}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isYou = user.id === currentUserId;
                  const tier = getTierTag(user.rank);

                  return (
                    <tr
                      key={user.id}
                      data-you={isYou}
                      className={isYou ? styles.rowHighlightYou : ''}
                    >
                      <td className={styles['lx-pts']}>{getRankBadge(user.rank)}</td>
                      <td>
                        <div className={styles['lx-name']}>
                          <div className={styles['lx-face']}>
                            {user.image ? (
                              <img src={user.image} alt={user.name || ''} />
                            ) : (
                              initials(user.name)
                            )}
                          </div>
                          <div className={styles.userMetaBlock}>
                            <div className={styles.userNameRow}>
                              <b>{user.name || (isAr ? 'متوقع يلا سبورت' : 'Yalla Predictor')}</b>
                              {isYou && <span className={styles.youBadge}>{labels.you}</span>}
                            </div>
                            {tier && (
                              <span className={styles.tierBadge}>
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>{tier}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }} className={styles['lx-pts']}>
                        <span className={styles.slipsBadge}>
                          {user.predictionsCount} {isAr ? 'توقع' : 'slips'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'end' }} className={styles['lx-pts']}>
                        <div className={styles.pointsBadgeWrap}>
                          <span className={styles.pointsNumber}>{user.points}</span>
                          <span className={styles.pointsLabel}>{labels.colPoints}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : filteredScorers.length === 0 ? (
        <div className={styles['ph-empty']}>
          <Medal className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p>{labels.emptyMessage}</p>
        </div>
      ) : (
        <div className={styles['lx-table']}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '90px' }}>{labels.colRank}</th>
                <th>{labels.colName}</th>
                <th>{labels.colTeam}</th>
                <th>{labels.colLeague}</th>
                <th style={{ textAlign: 'end' }}>{labels.colGoals}</th>
              </tr>
            </thead>
            <tbody>
              {filteredScorers.map((scorer) => (
                <tr key={`${scorer.leagueName}-${scorer.id}`}>
                  <td className={styles['lx-pts']}>{getRankBadge(scorer.rank)}</td>
                  <td>
                    <Link href={`/player/${scorer.slug}`} className={styles['lx-name']}>
                      <div className={styles['lx-face']}>
                        {scorer.photoUrl ? (
                          <img src={scorer.photoUrl} alt={scorer.name} />
                        ) : (
                          initials(scorer.name)
                        )}
                      </div>
                      <div className={styles.userMetaBlock}>
                        <b>{scorer.name}</b>
                        <span className={styles.scorerSubText}>
                          {isAr ? 'هداف معتمد' : 'Top Scorer'}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <span className={styles.teamTag}>{scorer.teamName || '—'}</span>
                  </td>
                  <td>
                    <span className={styles.leagueTag}>{scorer.leagueName}</span>
                  </td>
                  <td style={{ textAlign: 'end' }} className={styles['lx-pts']}>
                    <div className={styles.goalsBadgeWrap}>
                      <span className={styles.goalsNumber}>⚽ {scorer.goals}</span>
                      <span className={styles.goalsLabel}>{labels.colGoals}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
