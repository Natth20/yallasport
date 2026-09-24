'use client';

import React, { useState } from 'react';
import { ArrowRightLeft, CheckCircle2, AlertCircle, Clock, Sparkles, TrendingUp } from 'lucide-react';

interface TransferItem {
  id: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  fee?: string;
  status: 'DONE' | 'ADVANCED' | 'RUMOR';
  probability: number; // 0 - 100
  source: string;
}

const SAMPLE_TRANSFERS: TransferItem[] = [
  {
    id: '1',
    playerName: 'كيليان مبابي',
    fromTeam: 'باريس سان جيرمان',
    toTeam: 'ريال مدريد',
    fee: 'صفقة مجانية',
    status: 'DONE',
    probability: 100,
    source: 'الموقع الرسمي',
  },
  {
    id: '2',
    playerName: 'ترينت ألكسندر أرنولد',
    fromTeam: 'ليفربول',
    toTeam: 'ريال مدريد',
    fee: 'انتقال حر',
    status: 'ADVANCED',
    probability: 85,
    source: 'فابريزيو رومانو',
  },
  {
    id: '3',
    playerName: 'ألفونسو ديفيز',
    fromTeam: 'بايرن ميونخ',
    toTeam: 'ريال مدريد / مانشستر يونايتد',
    fee: '35 مليون €',
    status: 'ADVANCED',
    probability: 78,
    source: 'ذا أثلتيك',
  },
  {
    id: '4',
    playerName: 'محمد صلاح',
    fromTeam: 'ليفربول',
    toTeam: 'الدوري السعودي للمحترفين',
    fee: 'مفاوضات تجديد',
    status: 'RUMOR',
    probability: 50,
    source: 'سكاي سبورتس',
  },
];

export function TransferRumorsHub({ locale = 'ar' }: { locale?: string }) {
  const [filter, setFilter] = useState<'ALL' | 'DONE' | 'ADVANCED' | 'RUMOR'>('ALL');
  const isAr = locale === 'ar';

  const list = SAMPLE_TRANSFERS.filter((t) => filter === 'ALL' || t.status === filter);

  return (
    <div className="my-8 rounded-3xl border border-white/10 bg-card/60 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <ArrowRightLeft className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-black text-foreground">
                {isAr ? 'مركز ترند الانتقالات والصفقات (Transfer Hub)' : 'Transfer Rumors & Deals Hub'}
              </h3>
            </div>
            <p className="text-[11px] font-semibold text-foreground/50">
              {isAr ? 'متابعة لحظية لشائعات وصفقات الميركاتو مع نسبة الحسم' : 'Live transfer market tracker & deal probabilities'}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-foreground/5 p-1">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              filter === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('DONE')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              filter === 'DONE' ? 'bg-emerald-500 text-white' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {isAr ? 'رسمي تم ✅' : 'Confirmed'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('ADVANCED')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              filter === 'ADVANCED' ? 'bg-amber-500 text-white' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {isAr ? 'متقدم جداً ⏳' : 'Advanced'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('RUMOR')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              filter === 'RUMOR' ? 'bg-blue-500 text-white' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {isAr ? 'شائعات 💬' : 'Rumors'}
          </button>
        </div>
      </div>

      {/* Transfer Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((item) => {
          return (
            <div
              key={item.id}
              className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-card/80 p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-2">
                  <span className="text-sm font-black text-foreground">{item.playerName}</span>
                  {item.status === 'DONE' ? (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {isAr ? 'رسمي' : 'Official'}
                    </span>
                  ) : item.status === 'ADVANCED' ? (
                    <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400">
                      <Clock className="h-3 w-3" />
                      {isAr ? 'مفاوضات متقدمة' : 'Advanced'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-black text-blue-400">
                      <AlertCircle className="h-3 w-3" />
                      {isAr ? 'شائعة' : 'Rumor'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-foreground/75">
                  <span className="truncate">{item.fromTeam}</span>
                  <span className="text-primary font-black">←</span>
                  <span className="truncate text-foreground">{item.toTeam}</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-foreground/50">
                  <span>{isAr ? 'احتمالية إتمام الصفقة:' : 'Deal Probability:'}</span>
                  <span className="font-black text-primary tabular-nums">{item.probability}%</span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    style={{ width: `${item.probability}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.probability > 80
                        ? 'bg-emerald-500'
                        : item.probability > 60
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[9px] font-semibold text-foreground/40">
                  <span>{isAr ? `المصدر: ${item.source}` : `Source: ${item.source}`}</span>
                  {item.fee && <span>{item.fee}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
