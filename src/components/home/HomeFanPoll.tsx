'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Flame, Users, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

interface PollItem {
  id: string;
  category: string;
  questionAr: string;
  questionEn: string;
  options: {
    id: number;
    textAr: string;
    textEn: string;
    votes: number;
    logo?: string;
  }[];
}

const ACTIVE_POLLS: PollItem[] = [
  {
    id: 'poll-ucl-winner',
    category: 'دوري أبطال أوروبا',
    questionAr: 'من هو الأقرب للتتويج بلقب دوري أبطال أوروبا هذا الموسم؟ 🏆',
    questionEn: 'Who will lift the UEFA Champions League trophy this season?',
    options: [
      { id: 1, textAr: 'ريال مدريد', textEn: 'Real Madrid', votes: 14820, logo: 'https://media.api-sports.io/football/teams/541.png' },
      { id: 2, textAr: 'مانشستر سيتي', textEn: 'Manchester City', votes: 11200, logo: 'https://media.api-sports.io/football/teams/50.png' },
      { id: 3, textAr: 'بايرن ميونخ', textEn: 'Bayern Munich', votes: 4150, logo: 'https://media.api-sports.io/football/teams/157.png' },
      { id: 4, textAr: 'برشلونة', textEn: 'Barcelona', votes: 3890, logo: 'https://media.api-sports.io/football/teams/529.png' },
    ],
  },
  {
    id: 'poll-golden-boot',
    category: 'الحذاء الذهبي الأوروبي',
    questionAr: 'من يحسم سباق الهدافين وجائزة الحذاء الذهبي 2026؟ ⚽👟',
    questionEn: 'Who will win the European Golden Boot 2026?',
    options: [
      { id: 1, textAr: 'إيرلينغ هالاند (مانشستر سيتي)', textEn: 'Erling Haaland', votes: 16400 },
      { id: 2, textAr: 'كيليان مبابي (ريال مدريد)', textEn: 'Kylian Mbappé', votes: 15200 },
      { id: 3, textAr: 'محمد صلاح (ليفربول)', textEn: 'Mohamed Salah', votes: 11800 },
      { id: 4, textAr: 'هاري كين (بايرن ميونخ)', textEn: 'Harry Kane', votes: 7200 },
    ],
  },
  {
    id: 'poll-roshn-title',
    category: 'دوري روشن السعودي',
    questionAr: 'من يحسم لقب دوري روشن السعودي للمحترفين؟ 🇸🇦',
    questionEn: 'Who will win the Saudi Pro League title?',
    options: [
      { id: 1, textAr: 'الهلال', textEn: 'Al Hilal', votes: 21300, logo: 'https://media.api-sports.io/football/teams/607.png' },
      { id: 2, textAr: 'النصر', textEn: 'Al Nassr', votes: 18450, logo: 'https://media.api-sports.io/football/teams/608.png' },
      { id: 3, textAr: 'الاتحاد', textEn: 'Al Ittihad', votes: 9200, logo: 'https://media.api-sports.io/football/teams/609.png' },
      { id: 4, textAr: 'الأهلي', textEn: 'Al Ahli', votes: 5600, logo: 'https://media.api-sports.io/football/teams/610.png' },
    ],
  },
];

export function HomeFanPoll({ locale = 'ar' }: { locale?: string }) {
  const isEn = locale !== 'ar';
  const [currentPollIdx, setCurrentPollIdx] = useState(0);
  const [votesState, setVotesState] = useState<Record<string, { votedOption: number; options: typeof ACTIVE_POLLS[0]['options'] }>>({});

  const poll = ACTIVE_POLLS[currentPollIdx];
  const currentVoteData = votesState[poll.id];
  const hasVoted = Boolean(currentVoteData);
  const selectedOption = currentVoteData?.votedOption;
  const currentOptions = currentVoteData ? currentVoteData.options : poll.options;

  const totalVotes = currentOptions.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = (optId: number) => {
    if (hasVoted) return;

    const updatedOptions = poll.options.map((opt) =>
      opt.id === optId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    setVotesState((prev) => ({
      ...prev,
      [poll.id]: {
        votedOption: optId,
        options: updatedOptions,
      },
    }));
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/85 via-card/65 to-card/90 p-6 backdrop-blur-xl shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-primary text-white shadow-md shadow-primary/30">
            <Flame className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-black text-primary border border-primary/25">
              {poll.category}
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              {isEn ? 'Fan Voice • Matchday Poll' : 'صوت الجماهير • استطلاع الجولة'}
            </h3>
          </div>
        </div>

        {/* Carousel Switcher for Polls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground me-1">
            <Users className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {totalVotes.toLocaleString('en-US')} {isEn ? 'votes' : 'صوت'}
            </span>
          </div>

          <div className="flex items-center rounded-lg bg-background/60 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setCurrentPollIdx((prev) => (prev > 0 ? prev - 1 : ACTIVE_POLLS.length - 1))}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
            <span className="px-1 text-[10px] font-black text-primary">
              {currentPollIdx + 1}/{ACTIVE_POLLS.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPollIdx((prev) => (prev < ACTIVE_POLLS.length - 1 ? prev + 1 : 0))}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Question */}
      <p className="text-sm font-black text-foreground mb-4 leading-relaxed">
        {isEn ? poll.questionEn : poll.questionAr}
      </p>

      {/* Options List */}
      <div className="space-y-2.5">
        {currentOptions.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={hasVoted}
              className={`group relative w-full text-start overflow-hidden rounded-2xl border p-3.5 transition-all duration-300 ${
                isSelected
                  ? 'border-primary bg-primary/15 shadow-md shadow-primary/20'
                  : hasVoted
                  ? 'border-white/10 bg-white/[0.02]'
                  : 'border-white/10 bg-white/[0.03] hover:border-primary/40 hover:bg-white/[0.06] hover:scale-[1.01]'
              }`}
            >
              {/* Animated Progress Bar fill if voted */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 start-0 transition-all duration-1000 ease-out ${
                    isSelected ? 'bg-primary/25' : 'bg-white/10'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between text-xs font-bold gap-2">
                <span className="flex items-center gap-2.5 text-foreground">
                  {opt.logo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={opt.logo} alt="" className="h-5 w-5 object-contain" />
                  )}
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 animate-bounce" />}
                  <span className="font-bold">{isEn ? opt.textEn : opt.textAr}</span>
                </span>

                {hasVoted && (
                  <span className={`tabular-nums font-black text-xs ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {percent}% ({opt.votes.toLocaleString('en-US')})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2 text-center text-xs font-black text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isEn ? 'Vote recorded! Live fan tally updated in real-time.' : 'تم تسجيل تصويتك بنجاح! تم تحديث نبض الجماهير فورياً.'}</span>
        </div>
      )}
    </div>
  );
}
