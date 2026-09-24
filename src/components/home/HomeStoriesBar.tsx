'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Flame,
  X,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  BarChart2,
  Eye,
  RefreshCw,
  Radio,
  Zap,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type StoryCategory = 'ALL' | 'GOAL' | 'SAVE' | 'DERBY' | 'SKILL' | 'TACTIC';

export interface StorySlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  category: 'GOAL' | 'SAVE' | 'DERBY' | 'SKILL' | 'TACTIC';
  image: string;
  badgeColor?: string;
  isLive?: boolean;
  matchScore?: string;
  minute?: string;
  teams?: {
    home: { name: string; logo: string; score: number };
    away: { name: string; logo: string; score: number };
  };
  keyStats?: { label: string; value: string; color?: string }[];
  source: string;
  likesCount: number;
  viewsCount: string;
  timeAgo: string;
  matchUrl?: string;
}

const ALL_STORIES: StorySlide[] = [
  {
    id: 'story-ucl-goal',
    title: 'صاروخية لا تُصد في الدقيقة 93! ⚽🚀',
    subtitle: 'تسديدة خرافية تسكن المقص الأيمن في الوقت بدل الضائع وتشعل مدرجات البرنابيو',
    tag: 'هدف قاتل ⚽',
    category: 'GOAL',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&auto=format&fit=crop&q=80',
    badgeColor: 'from-orange-500 to-amber-500',
    isLive: true,
    matchScore: '3 - 2',
    minute: '93\'',
    teams: {
      home: { name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png', score: 3 },
      away: { name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png', score: 2 },
    },
    keyStats: [
      { label: 'سرعة التسديدة', value: '124 كم/س', color: 'text-amber-400' },
      { label: 'المسافة', value: '28 متراً', color: 'text-cyan-400' },
      { label: 'الأهداف المتوقعة xG', value: '0.03', color: 'text-emerald-400' },
    ],
    source: 'Yalla UCL Live HD',
    likesCount: 18450,
    viewsCount: '128K',
    timeAgo: 'منذ دقيقتين',
    matchUrl: '/matches',
  },
  {
    id: 'story-save-miracle',
    title: 'تصدي الموسم المستحيل على خط المرمى! 🧤⚡',
    subtitle: 'ردة فعل إعجازية في كسر من الثانية تحرم الخصم من هدف تعادل محقق',
    tag: 'تصدي إعجازي 🧤',
    category: 'SAVE',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=900&auto=format&fit=crop&q=80',
    badgeColor: 'from-emerald-500 to-teal-500',
    isLive: false,
    matchScore: '1 - 0',
    minute: '88\'',
    teams: {
      home: { name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png', score: 1 },
      away: { name: 'أرسنال', logo: 'https://media.api-sports.io/football/teams/42.png', score: 0 },
    },
    keyStats: [
      { label: 'زمن الاستجابة', value: '0.22 ثانية', color: 'text-emerald-400' },
      { label: 'المسافة', value: '3.5 أمتار', color: 'text-cyan-400' },
      { label: 'أهداف مؤكدة تم منعها', value: '+1.94', color: 'text-amber-400' },
    ],
    source: 'Premier League Show',
    likesCount: 12900,
    viewsCount: '94K',
    timeAgo: 'منذ 18 دقيقة',
    matchUrl: '/matches',
  },
  {
    id: 'story-derby-riyadh',
    title: 'أجواء تاريخية وجنون ديربي العاصمة 🇸🇦🔥',
    subtitle: 'ثلاثية هلالية نارية واحتفالات صاخبة أمام 62 ألف مشجع في المملكة أرينا',
    tag: 'ديربي الرياض 🇸🇦',
    category: 'DERBY',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&auto=format&fit=crop&q=80',
    badgeColor: 'from-blue-600 to-indigo-600',
    isLive: true,
    matchScore: '3 - 1',
    minute: '76\'',
    teams: {
      home: { name: 'الهلال', logo: 'https://media.api-sports.io/football/teams/607.png', score: 3 },
      away: { name: 'النصر', logo: 'https://media.api-sports.io/football/teams/608.png', score: 1 },
    },
    keyStats: [
      { label: 'الاستحواذ', value: '61% - 39%', color: 'text-blue-400' },
      { label: 'الفرص الخطيرة', value: '7 فرص', color: 'text-amber-400' },
      { label: 'حضور الجماهير', value: '62,400', color: 'text-emerald-400' },
    ],
    source: 'SSC Sports Studio',
    likesCount: 29800,
    viewsCount: '210K',
    timeAgo: 'منذ 35 دقيقة',
    matchUrl: '/matches',
  },
  {
    id: 'story-magic-dribble',
    title: 'سحر الملاعب ومراوغة ثلاثية ساحرة! 🪄🌪️',
    subtitle: 'مهارة استثنائية وتجاوز المدافعين بلمستين قبل وضع الكرة في الشباك',
    tag: 'سحر ومهارات 🪄',
    category: 'SKILL',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=900&auto=format&fit=crop&q=80',
    badgeColor: 'from-purple-500 to-pink-500',
    isLive: false,
    matchScore: '2 - 0',
    minute: '64\'',
    teams: {
      home: { name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png', score: 2 },
      away: { name: 'أتلتيكو مدريد', logo: 'https://media.api-sports.io/football/teams/530.png', score: 0 },
    },
    keyStats: [
      { label: 'مراوغات ناجحة', value: '6 من 6', color: 'text-purple-400' },
      { label: 'صناعة أهداف xA', value: '1.45', color: 'text-cyan-400' },
      { label: 'تقييم اللقاء', value: '9.6 ⭐', color: 'text-amber-400' },
    ],
    source: 'La Liga Highlights',
    likesCount: 21400,
    viewsCount: '160K',
    timeAgo: 'منذ ساعة',
    matchUrl: '/matches',
  },
  {
    id: 'story-derby-cairo',
    title: 'تيفو وأهازيج أبطال إفريقيا في ستاد القاهرة 🦅🏆',
    subtitle: 'دخلة تاريخية لجماهير الأهلي وأجواء ليلية حماسية في نهائي الأبطال',
    tag: 'قمة إفريقية 🦅',
    category: 'DERBY',
    image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=900&auto=format&fit=crop&q=80',
    badgeColor: 'from-red-600 to-rose-600',
    isLive: false,
    matchScore: '2 - 0',
    minute: 'FT',
    teams: {
      home: { name: 'الأهلي المصري', logo: 'https://media.api-sports.io/football/teams/1030.png', score: 2 },
      away: { name: 'الترجي التونسي', logo: 'https://media.api-sports.io/football/teams/1031.png', score: 0 },
    },
    keyStats: [
      { label: 'عدد الحضور', value: '75,000', color: 'text-red-400' },
      { label: 'اللقب القاري', value: 'الأميرة الـ 12', color: 'text-amber-400' },
      { label: 'الشباك النظيفة', value: '10 مباريات', color: 'text-emerald-400' },
    ],
    source: 'CAF Champions Night',
    likesCount: 38200,
    viewsCount: '310K',
    timeAgo: 'منذ ساعتين',
    matchUrl: '/matches',
  },
  {
    id: 'story-tactic-mastery',
    title: 'تشريح تكتيكي: كيف فكك أرتيتا دفاع الخصم 🧠📋',
    subtitle: 'شرح تحركات خط الوسط بالضغط العكسي وخلق المساحات في العمق الدفاعي',
    tag: 'تكتيك يلا سبورت 📋',
    category: 'TACTIC',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=900&auto=format&fit=crop&q=80',
    badgeColor: 'from-amber-500 to-orange-600',
    isLive: false,
    matchScore: '4 - 1',
    minute: 'تحليل فني',
    teams: {
      home: { name: 'أرسنال', logo: 'https://media.api-sports.io/football/teams/42.png', score: 4 },
      away: { name: 'تشيلسي', logo: 'https://media.api-sports.io/football/teams/49.png', score: 1 },
    },
    keyStats: [
      { label: 'استرداد الكرة بالثلث الأخير', value: '14 مرة', color: 'text-emerald-400' },
      { label: 'دقة التمرير', value: '92%', color: 'text-cyan-400' },
      { label: 'كفاءة الضغط', value: '88%', color: 'text-amber-400' },
    ],
    source: 'Tactical Board HD',
    likesCount: 11500,
    viewsCount: '80K',
    timeAgo: 'منذ 3 ساعات',
    matchUrl: '/matches',
  },
  {
    id: 'story-ucl-volley',
    title: 'على الطاير من خارج منطقة الجزاء! 🎯💥',
    subtitle: 'هدف الموسم بدوري الأبطال بتسديدة مباشرة تسكن أقصى الزاوية المستحيلة',
    tag: 'هدف الجولة ⚽',
    category: 'GOAL',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=900&auto=format&fit=crop&q=80',
    badgeColor: 'from-orange-500 to-rose-500',
    isLive: false,
    matchScore: '2 - 1',
    minute: '52\'',
    teams: {
      home: { name: 'بايرن ميونخ', logo: 'https://media.api-sports.io/football/teams/157.png', score: 2 },
      away: { name: 'باريس سان جيرمان', logo: 'https://media.api-sports.io/football/teams/85.png', score: 1 },
    },
    keyStats: [
      { label: 'سرعة الكرة', value: '112 كم/س', color: 'text-amber-400' },
      { label: 'دوران الكرة', value: '8.4 دورة/ث', color: 'text-cyan-400' },
      { label: 'نسبة التسجيل xG', value: '0.02', color: 'text-emerald-400' },
    ],
    source: 'Champions League Spotlight',
    likesCount: 16700,
    viewsCount: '130K',
    timeAgo: 'منذ 4 ساعات',
    matchUrl: '/matches',
  },
];

const CATEGORY_TABS: { id: StoryCategory; labelAr: string; labelEn: string; icon: string }[] = [
  { id: 'ALL', labelAr: 'الكل', labelEn: 'All', icon: '🔥' },
  { id: 'GOAL', labelAr: 'أهداف الجولة', labelEn: 'Goals', icon: '⚽' },
  { id: 'SAVE', labelAr: 'تصديات', labelEn: 'Saves', icon: '🧤' },
  { id: 'DERBY', labelAr: 'ديربيات وقِمم', labelEn: 'Derbies', icon: '⚡' },
  { id: 'SKILL', labelAr: 'مهارات وفنون', labelEn: 'Skills', icon: '🪄' },
  { id: 'TACTIC', labelAr: 'تكتيك وكواليس', labelEn: 'Tactics', icon: '📋' },
];

const REACTION_EMOJIS = ['🔥', '⚽', '🧤', '👏', '❤️', '⚡'];

export function HomeStoriesBar({ locale = 'ar' }: { locale?: string }) {
  const isAr = locale === 'ar';
  const [activeCategory, setActiveCategory] = useState<StoryCategory>('ALL');
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [seenStories, setSeenStories] = useState<Record<string, boolean>>({
    'story-tactic-mastery': true,
    'story-ucl-volley': true,
  });

  // Filtered stories according to category
  const filteredStories = useMemo(() => {
    if (activeCategory === 'ALL') return ALL_STORIES;
    return ALL_STORIES.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const activeStory = activeStoryIdx !== null ? filteredStories[activeStoryIdx] : null;

  // Auto-progress story timer (5 seconds)
  useEffect(() => {
    if (activeStoryIdx === null || isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIdx < filteredStories.length - 1) {
            setActiveStoryIdx((curr) => (curr !== null ? curr + 1 : null));
            return 0;
          } else {
            setActiveStoryIdx(null);
            return 0;
          }
        }
        return prev + 2.5; // ~4 seconds
      });
    }, 100);

    return () => clearInterval(timer);
  }, [activeStoryIdx, isPaused, filteredStories.length]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeStoryIdx === null) return;
      if (e.key === 'Escape') setActiveStoryIdx(null);
      if (e.key === ' ' || e.key === 'Spacebar') setIsPaused((prev) => !prev);
      if (e.key === 'ArrowRight') {
        if (isAr) handlePrevStory();
        else handleNextStory();
      }
      if (e.key === 'ArrowLeft') {
        if (isAr) handleNextStory();
        else handlePrevStory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryIdx, isAr]);

  const handleOpenStory = (index: number) => {
    setActiveStoryIdx(index);
    setProgress(0);
    setIsPaused(false);
    const storyId = filteredStories[index]?.id;
    if (storyId) {
      setSeenStories((prev) => ({ ...prev, [storyId]: true }));
    }
  };

  const handleNextStory = useCallback(() => {
    if (activeStoryIdx !== null && activeStoryIdx < filteredStories.length - 1) {
      setActiveStoryIdx(activeStoryIdx + 1);
      setProgress(0);
    } else {
      setActiveStoryIdx(null);
    }
  }, [activeStoryIdx, filteredStories.length]);

  const handlePrevStory = useCallback(() => {
    if (activeStoryIdx !== null && activeStoryIdx > 0) {
      setActiveStoryIdx(activeStoryIdx - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [activeStoryIdx]);

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLikedStories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const triggerReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: Math.random() * 60 + 20, // percentage from left
    };
    setReactions((prev) => [...prev.slice(-8), newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 1800);
  };

  const handleShareStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/75 to-card/95 p-5 backdrop-blur-2xl shadow-2xl shadow-primary/5 transition-all">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-16 left-1/3 h-48 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-1/4 h-48 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-400 text-white shadow-lg shadow-primary/30">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-foreground">
                {isAr ? 'ستوريات وملخصات يلا سبورت' : 'YallaSport Match Stories'}
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[9px] font-black uppercase text-red-400 shadow-sm animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE REELS
              </span>
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
              {isAr ? 'أبرز لقطات وأهداف وتكتيكات الجولة دقيقة بدقيقة' : 'Top match highlights, goals & tactics updated 24/7'}
            </p>
          </div>
        </div>

        {/* Categories Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-black transition-all ${
                activeCategory === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105'
                  : 'border border-white/5 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stories Horizontal Carousel */}
      <div className="relative z-10 flex items-center gap-4.5 overflow-x-auto pt-4 pb-2 no-scrollbar scroll-smooth">
        {filteredStories.map((story, idx) => {
          const isSeen = seenStories[story.id];
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => handleOpenStory(idx)}
              className="group flex shrink-0 flex-col items-center gap-2 focus:outline-none transition-transform hover:-translate-y-1"
            >
              {/* Story Circular Ring */}
              <div
                className={`relative flex h-18 w-18 sm:h-22 sm:w-22 items-center justify-center rounded-full p-0.75 transition-all duration-300 group-hover:scale-105 ${
                  !isSeen
                    ? 'bg-gradient-to-tr from-primary via-orange-500 to-amber-400 shadow-xl shadow-primary/30 animate-[pulse_3s_infinite]'
                    : 'bg-white/20 hover:bg-primary/50'
                }`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-background">
                  {/* Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.image}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-115"
                  />

                  {/* Dark hover layer with play icon */}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[1px]">
                    <Play className="h-6 w-6 fill-white text-white drop-shadow-md" />
                  </span>

                  {/* Top Live Pulse badge if live */}
                  {story.isLive && (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-1.5 py-0.2 text-[7px] font-black uppercase text-white shadow-md">
                      LIVE
                    </span>
                  )}

                  {/* Home Team mini badge at bottom */}
                  {story.teams?.home && (
                    <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-background/95 p-0.75 border border-white/20 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={story.teams.home.logo} alt="" className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Story Tag & Views */}
              <div className="flex flex-col items-center text-center max-w-[85px] sm:max-w-[100px]">
                <span className="truncate text-[11px] font-black text-foreground group-hover:text-primary transition-colors">
                  {story.tag}
                </span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-semibold mt-0.5">
                  <Eye className="h-2.5 w-2.5" />
                  <span>{story.viewsCount}</span>
                  <span>•</span>
                  <span>{story.timeAgo}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fullscreen Interactive Story Viewer Modal */}
      {activeStory && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-2xl animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsPaused(!isPaused)}
        >
          {/* Main Reel Container (9:16 Aspect Ratio) */}
          <div
            className="relative flex aspect-[9/16] h-[92vh] max-h-[750px] w-full max-w-sm sm:max-w-md flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/20 bg-background shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cinematic Background Visual with slow Ken-Burns effect */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeStory.image}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                isPaused ? 'scale-105' : 'scale-120'
              }`}
            />

            {/* Gradient Overlays for optimal readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/35 to-black/80" />

            {/* Floating Reactions Render Layer */}
            <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
              {reactions.map((r) => (
                <span
                  key={r.id}
                  className="absolute text-3xl animate-[floatUp_1.8s_ease-out_forwards] drop-shadow-lg"
                  style={{ left: `${r.x}%`, bottom: '20%' }}
                >
                  {r.emoji}
                </span>
              ))}
            </div>

            {/* Top Multi-Segment Progress Bars */}
            <div className="relative z-20 flex gap-1 p-3.5 pt-3.5">
              {filteredStories.map((_, i) => (
                <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  <div
                    className={`h-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-100 ${
                      i < (activeStoryIdx ?? 0)
                        ? 'w-full'
                        : i === activeStoryIdx
                        ? ''
                        : 'w-0'
                    }`}
                    style={i === activeStoryIdx ? { width: `${progress}%` } : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Story Header Bar */}
            <div className="relative z-20 flex items-center justify-between px-4 py-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-orange-500 p-1 border border-white/20 shadow-md">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{activeStory.source}</span>
                    <span className="rounded-full bg-primary/80 px-2 py-0.2 text-[8px] font-black text-white">
                      {activeStory.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/70 font-semibold">
                    <span>{activeStory.timeAgo}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {activeStory.viewsCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Controls (Mute, Pause, Close) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80"
                  title="كتم / تشغيل الصوت"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80"
                  title={isPaused ? 'تشغيل' : 'إيقاف مؤقت'}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStoryIdx(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80"
                  title="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tap Navigation Zones (Left & Right) */}
            <div className="absolute inset-y-16 inset-x-0 z-10 flex justify-between">
              <button
                type="button"
                onClick={isAr ? handleNextStory : handlePrevStory}
                className="h-full w-1/3 opacity-0 hover:opacity-100 flex items-center justify-start ps-2 transition-opacity"
              >
                <span className="rounded-full bg-black/60 p-2.5 text-white backdrop-blur-md shadow-xl">
                  <ChevronLeft className="h-6 w-6" />
                </span>
              </button>
              <button
                type="button"
                onClick={isAr ? handlePrevStory : handleNextStory}
                className="h-full w-1/3 opacity-0 hover:opacity-100 flex items-center justify-end pe-2 transition-opacity"
              >
                <span className="rounded-full bg-black/60 p-2.5 text-white backdrop-blur-md shadow-xl">
                  <ChevronRight className="h-6 w-6" />
                </span>
              </button>
            </div>

            {/* Story Bottom Content & Interactive Dock */}
            <div className="relative z-20 p-4 pb-5 space-y-3">
              {/* Match Score Banner */}
              {activeStory.teams && (
                <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-black/75 p-3 backdrop-blur-md shadow-xl">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeStory.teams.home.logo} alt="" className="h-7 w-7 object-contain drop-shadow" />
                    <span className="text-xs font-black text-white">{activeStory.teams.home.name}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="rounded-xl bg-primary px-2.5 py-0.5 text-xs font-black text-white shadow-md shadow-primary/30">
                      {activeStory.matchScore}
                    </span>
                    {activeStory.minute && (
                      <span className="text-[9px] font-bold text-amber-300 font-mono mt-0.5">
                        {activeStory.minute}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-white">{activeStory.teams.away.name}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeStory.teams.away.logo} alt="" className="h-7 w-7 object-contain drop-shadow" />
                  </div>
                </div>
              )}

              {/* Story Title & Subtitle */}
              <div>
                <h3 className="text-base sm:text-lg font-black leading-snug text-white drop-shadow-md">
                  {activeStory.title}
                </h3>
                <p className="mt-1 text-xs font-medium text-white/90 line-clamp-2 drop-shadow">
                  {activeStory.subtitle}
                </p>
              </div>

              {/* Key Match Statistics Badges */}
              {activeStory.keyStats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {activeStory.keyStats.map((st, i) => (
                    <div key={i} className="rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/10 shadow-sm">
                      <span className="block text-[9px] text-white/70 font-semibold">{st.label}</span>
                      <strong className={`block text-xs font-black ${st.color || 'text-amber-300'} tabular-nums mt-0.5`}>
                        {st.value}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Reactions Bar */}
              <div className="flex items-center justify-between gap-1 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/10">
                <span className="text-[10px] font-bold text-white/70 ps-1.5 hidden sm:inline">
                  {isAr ? 'تفاعل سريع:' : 'React:'}
                </span>
                <div className="flex items-center gap-1 justify-around flex-1">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => triggerReaction(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-base transition-transform hover:scale-125 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Like, Share, Match Center */}
              <div className="flex items-center gap-2 pt-1">
                {/* Like button */}
                <button
                  type="button"
                  onClick={(e) => toggleLike(e, activeStory.id)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl backdrop-blur-md transition-all ${
                    likedStories[activeStory.id]
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 scale-105'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                  title="إعجاب"
                >
                  <Heart className={`h-5 w-5 ${likedStories[activeStory.id] ? 'fill-current' : ''}`} />
                </button>

                {/* Share button */}
                <button
                  type="button"
                  onClick={handleShareStory}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-all"
                  title="مشاركة الستوري"
                >
                  <Share2 className="h-5 w-5" />
                </button>

                {/* Match Center CTA Link */}
                <Link
                  href="/matches"
                  onClick={() => setActiveStoryIdx(null)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-amber-500 py-3 text-xs font-black text-white shadow-xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  <BarChart2 className="h-4 w-4" />
                  <span>{isAr ? 'مركز المباراة والتفاصيل' : 'Open Match Center'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
