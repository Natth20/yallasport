'use client';
import { reportCaughtError } from '@/lib/ops/caught';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Mic,
  Trophy,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

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
  };
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
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const recognitionRef = useRef<any>(null);

  // Available leagues from scorers
  const leagues = useMemo(() => {
    const list = Array.from(new Set(realScorers.map((s) => s.leagueName))).filter(Boolean);
    return ['ALL', ...list];
  }, [realScorers]);

  // Voice Search setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setSearchQuery(transcript.trim());
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setSpeechError(locale === 'ar' ? 'تعذر التعرف على الصوت، يرجى المحاولة ثانية' : 'Voice recognition error, please try again');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          reportCaughtError("src/components/predictions/LeaderboardExplorer.tsx:127", error, { persist: false });
          // ignore
        }
      }
    };
  }, [locale]);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      setSpeechError(labels.voiceUnsupported);
      setTimeout(() => setSpeechError(null), 3500);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setSpeechError(null);
        recognitionRef.current.start();
      } catch (error) {
        reportCaughtError("src/components/predictions/LeaderboardExplorer.tsx:148", error, { persist: false });
        recognitionRef.current.stop();
      }
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return userRanks;
    const query = searchQuery.toLowerCase().trim();
    return userRanks.filter((u) => (u.name || '').toLowerCase().includes(query));
  }, [userRanks, searchQuery]);

  // Filtered Scorers
  const filteredScorers = useMemo(() => {
    let list = realScorers;
    if (selectedLeague !== 'ALL') {
      list = list.filter((s) => s.leagueName === selectedLeague);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.teamName || '').toLowerCase().includes(query) ||
          s.leagueName.toLowerCase().includes(query)
      );
    }
    return list;
  }, [realScorers, selectedLeague, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Bar & Voice Bar */}
      <div className="relative rounded-3xl border border-border bg-gradient-to-r from-card/80 via-card/50 to-card/80 p-3 sm:p-4 backdrop-blur-2xl shadow-xl shadow-black/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Main Tabs */}
          <div className="flex rounded-2xl bg-muted p-1.5 border border-border shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'users'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Trophy className="h-4 w-4" />
              <span>{labels.tabUsers}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono">
                {userRanks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('scorers')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === 'scorers'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/25 scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Target className="h-4 w-4" />
              <span>{labels.tabScorers}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono">
                {realScorers.length}
              </span>
            </button>
          </div>

          {/* Voice & Input Filter */}
          <div className="relative flex-1 sm:max-w-md">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute start-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isListening ? labels.voiceListening : labels.searchPlaceholder}
                className={`w-full rounded-2xl border bg-muted py-2.5 pe-20 ps-10 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${isListening
                    ? 'border-red-500 ring-2 ring-red-500/30 animate-pulse'
                    : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                  }`}
              />
              <div className="absolute end-2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    title={labels.clearSearch}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {/* Voice Search Button */}
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  title={isListening ? labels.voiceListening : labels.searchPlaceholder}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all ${isListening
                      ? 'bg-red-500 text-foreground shadow-lg shadow-red-500/40 animate-bounce'
                      : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                    }`}
                >
                  {isListening ? <Mic className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isListening && (
                    <span className="absolute -inset-1 rounded-xl bg-red-500/30 animate-ping pointer-events-none" />
                  )}
                </button>
              </div>
            </div>

            {speechError && (
              <p className="absolute -bottom-5 start-2 text-[10px] font-medium text-amber-400">
                {speechError}
              </p>
            )}
          </div>
        </div>

        {/* League selector chips if in Scorers tab */}
        {activeTab === 'scorers' && leagues.length > 2 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-border">
            {leagues.map((lg) => (
              <button
                key={lg}
                onClick={() => setSelectedLeague(lg)}
                className={`rounded-xl px-3 py-1 text-[11px] font-bold transition-all ${selectedLeague === lg
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                {lg === 'ALL' ? (locale === 'ar' ? 'جميع الدوريات' : 'All Leagues') : lg}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'users' ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-card/40 backdrop-blur-xl shadow-2xl">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground">{labels.emptyMessage}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="border-b border-border bg-muted text-[11px] font-bold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-4 text-start w-20">{labels.colRank}</th>
                    <th className="px-5 py-4 text-start">{labels.colName}</th>
                    <th className="px-5 py-4 text-center w-36">{labels.colPredictions}</th>
                    <th className="px-5 py-4 text-end w-36">{labels.colPoints}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => {
                    const isYou = user.id === currentUserId;
                    const rankMedal =
                      user.rank === 1
                        ? '🥇'
                        : user.rank === 2
                          ? '🥈'
                          : user.rank === 3
                            ? '🥉'
                            : null;

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${isYou
                            ? 'bg-primary/15 font-bold text-foreground shadow-inner'
                            : 'hover:bg-muted text-foreground/90'
                          }`}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-sm">
                          {rankMedal ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="text-base">{rankMedal}</span>
                              <span className="text-xs text-amber-400">{String(user.rank).padStart(2, '0')}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{String(user.rank).padStart(2, '0')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted font-black text-foreground overflow-hidden border border-border shadow-sm">
                              {user.image ? (
                                <img src={user.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                (user.name || 'U').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate font-bold text-foreground text-sm">
                                {user.name || (locale === 'ar' ? 'متسابق مجهول' : 'Anonymous')}
                              </span>
                              {isYou && (
                                <span className="inline-block rounded bg-primary/20 px-2 py-0.2 text-[10px] font-bold text-primary border border-primary/30">
                                  {locale === 'ar' ? 'أنت' : 'You'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-mono font-medium text-muted-foreground">
                          {user.predictionsCount}
                        </td>
                        <td className="px-5 py-4 text-end">
                          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400/10 px-3 py-1 font-mono text-sm font-black text-amber-400 border border-amber-400/20 shadow-sm">
                            <Sparkles className="h-3.5 w-3.5" />
                            {user.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card/40 backdrop-blur-xl shadow-2xl">
          {filteredScorers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground">{labels.emptyMessage}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="border-b border-border bg-muted text-[11px] font-bold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-4 text-start w-20">{labels.colRank}</th>
                    <th className="px-5 py-4 text-start">{labels.colName}</th>
                    <th className="px-5 py-4 text-start">{labels.colTeam}</th>
                    <th className="px-5 py-4 text-start">{labels.colLeague}</th>
                    <th className="px-5 py-4 text-end w-32">{labels.colGoals}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredScorers.map((scorer) => {
                    const rankMedal =
                      scorer.rank === 1
                        ? '🥇'
                        : scorer.rank === 2
                          ? '🥈'
                          : scorer.rank === 3
                            ? '🥉'
                            : null;

                    return (
                      <tr
                        key={`${scorer.leagueName}-${scorer.id}`}
                        className="transition-colors hover:bg-muted text-foreground/90"
                      >
                        <td className="px-5 py-4 font-mono font-bold text-sm">
                          {rankMedal ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="text-base">{rankMedal}</span>
                              <span className="text-xs text-amber-400">{String(scorer.rank).padStart(2, '0')}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{String(scorer.rank).padStart(2, '0')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/player/${scorer.slug}`}
                            className="group flex items-center gap-3"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted font-bold overflow-hidden border border-border shadow-sm shrink-0">
                              <img
                                src={scorer.photoUrl || '/placeholder-player.svg'}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-extrabold text-foreground text-sm group-hover:text-primary transition-colors">
                              {scorer.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground/80">
                          {scorer.teamName || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block rounded-lg bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground border border-border">
                            {scorer.leagueName}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3.5 py-1.5 font-mono text-sm font-black text-emerald-400 border border-emerald-500/30 shadow-sm">
                            <Target className="h-3.5 w-3.5" />
                            {scorer.goals}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
