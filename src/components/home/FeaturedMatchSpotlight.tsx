'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Sparkles,
  Tv,
  Clock,
  Trophy,
  ArrowRight,
  Zap,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  Share2,
  Users,
  Activity,
  Award,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface MatchHeroData {
  id: string;
  league: string;
  leagueLogo?: string;
  badge: string;
  round: string;
  homeTeam: {
    name: string;
    logo: string;
    form: ('W' | 'D' | 'L')[];
    stadium: string;
    winProb: number;
    coach: string;
    formation: string;
    keyPlayer: { name: string; number: number; photo: string; role: string };
  };
  awayTeam: {
    name: string;
    logo: string;
    form: ('W' | 'D' | 'L')[];
    winProb: number;
    coach: string;
    formation: string;
    keyPlayer: { name: string; number: number; photo: string; role: string };
  };
  drawProb: number;
  kickoffTime: string;
  timeRemainingSec: number;
  channel: string;
  commentator: string;
  stadium: string;
  hotStat: string;
  referee: string;
}

const FEATURED_MATCHES: MatchHeroData[] = [
  {
    id: 'ucl-rm-mci',
    league: 'دوري أبطال أوروبا • ربع النهائي',
    badge: 'قمة الأسبوع النارية 🔥',
    round: 'ذهاب دور الـ 8 الأوروبي',
    homeTeam: {
      name: 'ريال مدريد',
      logo: 'https://media.api-sports.io/football/teams/541.png',
      form: ['W', 'W', 'W', 'D', 'W'],
      stadium: 'سانتياغو برنابيو',
      winProb: 44,
      coach: 'كارلو أنشيلوتي',
      formation: '4-3-1-2',
      keyPlayer: {
        name: 'فينيسيوس جونيور',
        number: 7,
        photo: 'https://media.api-sports.io/football/players/278.png',
        role: 'هداف الفريق',
      },
    },
    awayTeam: {
      name: 'مانشستر سيتي',
      logo: 'https://media.api-sports.io/football/teams/50.png',
      form: ['W', 'W', 'W', 'W', 'D'],
      winProb: 34,
      coach: 'بيب غوارديولا',
      formation: '4-1-4-1',
      keyPlayer: {
        name: 'إيرلينغ هالاند',
        number: 9,
        photo: 'https://media.api-sports.io/football/players/1100.png',
        role: 'القناص النرويجي',
      },
    },
    drawProb: 22,
    kickoffTime: '22:00 مكة',
    timeRemainingSec: 14850,
    channel: 'beIN Sports 1 HD Premium',
    commentator: 'عصام الشوالي',
    stadium: 'سانتياغو برنابيو (مدريد)',
    hotStat: 'سجل ريال مدريد 18 هدفاً في آخر 6 مباريات أوروبية على أرضه هذا الموسم',
    referee: 'سيمون مارشينياك (بولندا)',
  },
  {
    id: 'epl-liv-ars',
    league: 'الدوري الإنجليزي الممتاز • الجولة 28',
    badge: 'صراع الصدارة ⚡',
    round: 'قمة البريميرليغ',
    homeTeam: {
      name: 'ليفربول',
      logo: 'https://media.api-sports.io/football/teams/40.png',
      form: ['W', 'W', 'D', 'W', 'W'],
      stadium: 'أنفيلد',
      winProb: 41,
      coach: 'أرني سلوت',
      formation: '4-2-3-1',
      keyPlayer: {
        name: 'محمد صلاح',
        number: 11,
        photo: 'https://media.api-sports.io/football/players/306.png',
        role: 'الملك المصري',
      },
    },
    awayTeam: {
      name: 'أرسنال',
      logo: 'https://media.api-sports.io/football/teams/42.png',
      form: ['W', 'W', 'W', 'D', 'W'],
      winProb: 36,
      coach: 'ميكيل أرتيتا',
      formation: '4-3-3',
      keyPlayer: {
        name: 'بوكايو ساكا',
        number: 7,
        photo: 'https://media.api-sports.io/football/players/1465.png',
        role: 'نجم المدفعجية',
      },
    },
    drawProb: 23,
    kickoffTime: '19:30 مكة',
    timeRemainingSec: 28400,
    channel: 'beIN Sports 2 HD',
    commentator: 'حفيظ دراجي',
    stadium: 'أنفيلد رود (ليفربول)',
    hotStat: 'أقوى خط هجوم في إنجلترا يصطدم بأقوى خط دفاع استقبل 19 هدفاً فقط',
    referee: 'مايكل أوليفر (إنجلترا)',
  },
  {
    id: 'spl-hil-nas',
    league: 'دوري روشن السعودي للمحترفين • ديربي الرياض',
    badge: 'ديربي العاصمة 🇸🇦',
    round: 'قمة روشن الكبرى',
    homeTeam: {
      name: 'الهلال',
      logo: 'https://media.api-sports.io/football/teams/607.png',
      form: ['W', 'W', 'W', 'W', 'W'],
      stadium: 'المملكة أرينا',
      winProb: 47,
      coach: 'جورجي جيسوس',
      formation: '4-2-3-1',
      keyPlayer: {
        name: 'ألكسندر ميتروفيتش',
        number: 9,
        photo: 'https://media.api-sports.io/football/players/2870.png',
        role: 'هداف الزعيم',
      },
    },
    awayTeam: {
      name: 'النصر',
      logo: 'https://media.api-sports.io/football/teams/608.png',
      form: ['W', 'W', 'D', 'W', 'W'],
      winProb: 32,
      coach: 'ستيفانو بيولي',
      formation: '4-3-3',
      keyPlayer: {
        name: 'كريستيانو رونالدو',
        number: 7,
        photo: 'https://media.api-sports.io/football/players/874.png',
        role: 'الدون الأسطوري',
      },
    },
    drawProb: 21,
    kickoffTime: '21:00 مكة',
    timeRemainingSec: 42000,
    channel: 'SSC 1 HD',
    commentator: 'فارس عوض',
    stadium: 'المملكة أرينا (الرياض)',
    hotStat: 'سلسلة 34 فوزاً تاريخياً للهلال تواجه أقوى هجوم للنصر بقيادة رونالدو',
    referee: 'إستفان كوفاكس (رومانيا)',
  },
];

export function FeaturedMatchSpotlight({ locale = 'ar' }: { locale?: string }) {
  const isEn = locale !== 'ar';
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reminded, setReminded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const match = FEATURED_MATCHES[selectedIdx];
  const [secondsLeft, setSecondsLeft] = useState(match.timeRemainingSec);

  useEffect(() => {
    setSecondsLeft(match.timeRemainingSec);
    setReminded(false);
  }, [selectedIdx, match.timeRemainingSec]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/30 bg-gradient-to-br from-card/95 via-card/80 to-card/95 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-2xl shadow-primary/10 transition-all">
      {/* Stadium Floodlights & Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08)_0%,transparent_70%)]" />

      {/* Top Header: Badge, League & Match Carousel Pills */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-400 text-white shadow-xl shadow-primary/40">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-3 py-0.5 text-[10px] font-black uppercase text-primary border border-primary/30">
                {match.badge}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <Trophy className="h-4 w-4 text-amber-400" />
                {match.league}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {match.homeTeam.name} <span className="text-primary font-bold">ضد</span> {match.awayTeam.name}
            </h3>
          </div>
        </div>

        {/* Top Right Controls: Switcher Pills & Countdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Match Carousel Selector */}
          <div className="flex items-center gap-1 rounded-2xl bg-background/60 p-1 border border-white/10 backdrop-blur-md">
            {FEATURED_MATCHES.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                  selectedIdx === idx
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {idx === 0 ? 'مدريد × سيتي' : idx === 1 ? 'ليفربول × أرسنال' : 'الهلال × النصر'}
              </button>
            ))}
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-background/80 px-4 py-2 backdrop-blur-md shadow-inner">
            <Clock className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '8s' }} />
            <div className="flex items-center gap-1.5 font-mono text-xs font-black text-foreground">
              <span className="rounded-lg bg-card px-2 py-0.5">{String(hours).padStart(2, '0')}</span>
              <span>:</span>
              <span className="rounded-lg bg-card px-2 py-0.5">{String(minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span className="rounded-lg bg-primary/20 text-primary px-2 py-0.5">{String(seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Duel Stage (Team 1 vs Team 2) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 items-center gap-6 my-8">
        {/* Team 1 Card */}
        <div className="md:col-span-4 group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-card/90 to-card/50 p-5 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-2.5 shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                className="h-16 w-16 object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[9px] font-black text-primary border border-primary/20">
                  صاحب الأرض
                </span>
                <span className="text-xs font-bold text-muted-foreground truncate">
                  الخطة: {match.homeTeam.formation}
                </span>
              </div>
              <h4 className="text-xl font-black text-foreground truncate mt-1">
                {match.homeTeam.name}
              </h4>
              <div className="mt-2.5 flex items-center gap-1 text-[10px] font-black">
                <span className="text-muted-foreground me-1">النتائج الأخيرة:</span>
                {match.homeTeam.form.map((res, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-1.5 py-0.5 shadow-sm ${
                      res === 'W'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : res === 'D'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {res === 'W' ? 'فوز' : res === 'D' ? 'تعادل' : 'خسارة'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Key Player Spotlight Mini-strip */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 p-2.5 border border-white/5 text-xs">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={match.homeTeam.keyPlayer.photo} alt="" className="h-6 w-6 rounded-full object-cover bg-white/10" />
              <span className="font-bold text-white">{match.homeTeam.keyPlayer.name} (#{match.homeTeam.keyPlayer.number})</span>
            </div>
            <span className="text-[10px] font-bold text-amber-300">{match.homeTeam.keyPlayer.role}</span>
          </div>
        </div>

        {/* Center Stage: VS + Stadium & TV Info */}
        <div className="md:col-span-3 flex flex-col items-center justify-center text-center">
          <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary via-orange-500 to-amber-400 text-white font-black text-2xl shadow-2xl shadow-primary/40 border border-white/20">
            VS
            <div className="absolute -inset-2 rounded-3xl border border-primary/50 animate-ping opacity-25 pointer-events-none" />
          </div>

          <div className="mt-3 flex flex-col items-center gap-1.5">
            <span className="text-xs font-black text-foreground bg-white/5 px-3.5 py-1 rounded-full border border-white/10">
              {match.kickoffTime}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Tv className="h-4 w-4" />
              <span>{match.channel}</span>
            </div>
          </div>
        </div>

        {/* Team 2 Card */}
        <div className="md:col-span-4 group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-l from-card/90 to-card/50 p-5 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-2.5 shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                className="h-16 w-16 object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[9px] font-black text-cyan-400 border border-cyan-500/20">
                  الفريق الضيف
                </span>
                <span className="text-xs font-bold text-muted-foreground truncate">
                  الخطة: {match.awayTeam.formation}
                </span>
              </div>
              <h4 className="text-xl font-black text-foreground truncate mt-1">
                {match.awayTeam.name}
              </h4>
              <div className="mt-2.5 flex items-center gap-1 text-[10px] font-black">
                <span className="text-muted-foreground me-1">النتائج الأخيرة:</span>
                {match.awayTeam.form.map((res, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-1.5 py-0.5 shadow-sm ${
                      res === 'W'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : res === 'D'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {res === 'W' ? 'فوز' : res === 'D' ? 'تعادل' : 'خسارة'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Key Player Spotlight Mini-strip */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 p-2.5 border border-white/5 text-xs">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={match.awayTeam.keyPlayer.photo} alt="" className="h-6 w-6 rounded-full object-cover bg-white/10" />
              <span className="font-bold text-white">{match.awayTeam.keyPlayer.name} (#{match.awayTeam.keyPlayer.number})</span>
            </div>
            <span className="text-[10px] font-bold text-cyan-300">{match.awayTeam.keyPlayer.role}</span>
          </div>
        </div>
      </div>

      {/* AI Win Expectancy & Probability Bar */}
      <div className="relative z-10 rounded-2xl bg-background/60 p-4.5 border border-white/10 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between text-xs font-black mb-3 gap-2">
          <span className="text-primary flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary animate-pulse" />
            فوز {match.homeTeam.name}: {match.homeTeam.winProb}%
          </span>
          <span className="text-muted-foreground font-mono">
            احتمال التعادل: {match.drawProb}%
          </span>
          <span className="text-cyan-400 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-cyan-400" />
            فوز {match.awayTeam.name}: {match.awayTeam.winProb}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-card/90 flex p-0.5 shadow-inner border border-white/5">
          <div
            className="h-full rounded-s-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-700"
            style={{ width: `${match.homeTeam.winProb}%` }}
          />
          <div
            className="h-full bg-white/20 transition-all duration-700"
            style={{ width: `${match.drawProb}%` }}
          />
          <div
            className="h-full rounded-e-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-700"
            style={{ width: `${match.awayTeam.winProb}%` }}
          />
        </div>

        {/* Hot Tactical Statistic Alert */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-muted-foreground border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{match.hotStat}</span>
          </div>
          <span className="text-[11px] font-mono text-foreground/60">الحكم: {match.referee}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
          <span>🎙️ المعلق: <strong className="text-foreground">{match.commentator}</strong></span>
          <span>•</span>
          <span>🏟️ {match.stadium}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Reminder Button */}
          <button
            type="button"
            onClick={() => setReminded(!reminded)}
            className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all ${
              reminded
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <Bell className={`h-4 w-4 ${reminded ? 'fill-emerald-400 text-emerald-400' : ''}`} />
            <span>{reminded ? 'تم ضبط التذكير ✓' : 'ذكرني بالموعد'}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-white/10"
          >
            <Share2 className="h-4 w-4" />
            <span>{copied ? 'تم النسخ!' : 'مشاركة'}</span>
          </button>

          {/* Head to head link */}
          <Link
            href={`/compare?team1=${encodeURIComponent(match.homeTeam.name)}&team2=${encodeURIComponent(match.awayTeam.name)}`}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-white/10 hover:text-primary"
          >
            {isEn ? 'Head to Head' : 'مقارنة الفريقين'}
          </Link>

          {/* Match Center CTA */}
          <Link
            href="/matches"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-amber-500 px-6 py-2.5 text-xs font-black text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
          >
            <span>{isEn ? 'Live Match Center' : 'مركز التغطية المباشرة'}</span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
