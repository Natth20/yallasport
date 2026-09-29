'use client';

import { reportCaughtError } from '@/lib/ops/caught';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
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

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setSearchQuery(transcript.trim());
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error !== 'no-speech') setSpeechError(labels.voiceUnsupported);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (error) {
        reportCaughtError('src/components/predictions/LeaderboardExplorer.tsx:cleanup', error, { persist: false });
      }
    };
  }, [locale, labels.voiceUnsupported]);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      setSpeechError(labels.voiceUnsupported);
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      setSpeechError(null);
      recognitionRef.current.start();
    } catch (error) {
      reportCaughtError('src/components/predictions/LeaderboardExplorer.tsx:voice', error, { persist: false });
      recognitionRef.current.stop();
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

  return (
    <div className={styles.lx}>
      <div className={styles['lx-bar']}>
        <div className={styles['lx-tabs']}>
          <button type="button" data-on={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            {labels.tabUsers}
            <i>{userRanks.length}</i>
          </button>
          <button type="button" data-on={activeTab === 'scorers'} onClick={() => setActiveTab('scorers')}>
            {labels.tabScorers}
            <i>{realScorers.length}</i>
          </button>
        </div>
        <div className={styles['lx-seek']}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isListening ? labels.voiceListening : labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
          />
          {searchQuery ? (
            <button type="button" onClick={() => setSearchQuery('')} title={labels.clearSearch}>
              ×
            </button>
          ) : (
            <button type="button" onClick={toggleVoiceSearch} title={labels.searchPlaceholder}>
              ⌕
            </button>
          )}
          {speechError ? <p>{speechError}</p> : null}
        </div>
      </div>

      {activeTab === 'scorers' && leagues.length > 2 ? (
        <div className={styles['lx-leagues']}>
          {leagues.map((lg) => (
            <button key={lg} type="button" data-on={selectedLeague === lg} onClick={() => setSelectedLeague(lg)}>
              {lg === 'ALL' ? labels.allLeagues : lg}
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === 'users' ? (
        filteredUsers.length === 0 ? (
          <p className={styles['ph-empty']}>{labels.emptyMessage}</p>
        ) : (
          <div className={styles['lx-table']}>
            <table>
              <thead>
                <tr>
                  <th>{labels.colRank}</th>
                  <th>{labels.colName}</th>
                  <th>{labels.colPredictions}</th>
                  <th>{labels.colPoints}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isYou = user.id === currentUserId;
                  return (
                    <tr key={user.id} data-you={isYou}>
                      <td className={styles['lx-pts']}>{String(user.rank).padStart(2, '0')}</td>
                      <td>
                        <span className={styles['lx-name']}>
                          <span className={styles['lx-face']}>
                            {user.image ? <img src={user.image} alt="" /> : initials(user.name)}
                          </span>
                          <span>
                            <b>{user.name || (locale === 'ar' ? 'بدون اسم' : 'Unnamed')}</b>
                            {isYou ? <em>{labels.you}</em> : null}
                          </span>
                        </span>
                      </td>
                      <td className={styles['lx-pts']}>{user.predictionsCount}</td>
                      <td className={styles['lx-pts']}>{user.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : filteredScorers.length === 0 ? (
        <p className={styles['ph-empty']}>{labels.emptyMessage}</p>
      ) : (
        <div className={styles['lx-table']}>
          <table>
            <thead>
              <tr>
                <th>{labels.colRank}</th>
                <th>{labels.colName}</th>
                <th>{labels.colTeam}</th>
                <th>{labels.colLeague}</th>
                <th>{labels.colGoals}</th>
              </tr>
            </thead>
            <tbody>
              {filteredScorers.map((scorer) => (
                <tr key={`${scorer.leagueName}-${scorer.id}`}>
                  <td className={styles['lx-pts']}>{String(scorer.rank).padStart(2, '0')}</td>
                  <td>
                    <Link href={`/player/${scorer.slug}`} className={styles['lx-name']}>
                      <span className={styles['lx-face']}>
                        {scorer.photoUrl ? <img src={scorer.photoUrl} alt="" /> : initials(scorer.name)}
                      </span>
                      <b>{scorer.name}</b>
                    </Link>
                  </td>
                  <td>{scorer.teamName || '—'}</td>
                  <td>{scorer.leagueName}</td>
                  <td className={styles['lx-pts']}>{scorer.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
