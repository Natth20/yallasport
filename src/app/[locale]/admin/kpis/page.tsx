// src/app/admin/kpis/page.tsx
import React from 'react';
import { prisma } from '@/lib/prisma';
import { TrendingUp, Users, Eye, Search, Bell } from 'lucide-react';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * Analytics Dashboard - Provides key performance indicators and traffic insights.
 */
export default async function AnalyticsDashboardPage() {
  const locale = await getLocale();
  const isLive = isLiveSportsApi();
  const [topNews, userCount, matchCount] = await Promise.all([
    prisma.news.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      select: { title: true, views: true },
    }),
    prisma.user.count(),
    prisma.match.count(),
  ]);

  const stats = [
    { 
      label: pick(locale, 'مصدر البيانات الحالي', 'Current data source'),
      value: isLive ? 'LIVE API' : pick(locale, 'غير مفعّل', 'Disabled'),
      icon: TrendingUp, 
      color: isLive ? 'text-green-500' : 'text-yellow-500',
      trend: isLive ? pick(locale, 'نشط', 'Active') : pick(locale, 'بانتظار المفتاح', 'Awaiting key')
    },
    { label: pick(locale, 'مباريات مسجّلة', 'Recorded matches'), value: String(matchCount), icon: Users, color: 'text-blue-600', trend: pick(locale, 'قاعدة البيانات', 'Database') },
    { label: pick(locale, 'أكثر الأخبار قراءة', 'Most-read news'), value: topNews?.title || pick(locale, 'لا يوجد بعد', 'None yet'), icon: Eye, color: 'text-orange-600', trend: topNews ? `${topNews.views} ${pick(locale, 'مشاهدة', 'views')}` : '—' },
    { label: pick(locale, 'تغطية المباريات', 'Match coverage'), value: matchCount > 0 ? pick(locale, 'متاحة', 'Available') : pick(locale, 'بانتظار المزامنة', 'Awaiting sync'), icon: Search, color: 'text-green-600', trend: pick(locale, 'حي', 'Live') },
    { label: pick(locale, 'المستخدمون', 'Users'), value: String(userCount), icon: Bell, color: 'text-purple-600', trend: pick(locale, 'حقيقي', 'Real') },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-foreground dark:text-foreground tracking-tight">{pick(locale, 'مؤشرات الأداء التحليلية', 'Analytics KPIs')}</h1>
        <div className="text-xs font-bold text-muted-foreground bg-muted dark:bg-muted px-4 py-2 rounded-full border border-border dark:border-border">
          {pick(locale, 'آخر تحديث:', 'Last updated:')} {new Date().toLocaleTimeString(locale)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((metric, i) => (
          <div key={i} className="bg-card dark:bg-background p-6 rounded-[2rem] shadow-xl border border-gray-50 dark:border-border transition-all hover:translate-y-[-4px]">
            <div className="flex justify-between items-start mb-6">
               <div className={`p-4 rounded-2xl bg-muted dark:bg-muted ${metric.color} shadow-inner`}>
                  <metric.icon className="w-5 h-5" />
               </div>
               <span className={`text-[10px] font-black px-3 py-1 rounded-full ${metric.color === 'text-green-500' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted dark:bg-muted'}`}>
                {metric.trend}
               </span>
            </div>
            <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest block mb-1">{metric.label}</span>
            <span className="text-xl font-black tabular-nums">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card dark:bg-background p-10 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-border flex flex-col items-center text-center justify-center">
           <div className="w-20 h-20 bg-orange-100 dark:bg-orange-950/20 rounded-full flex items-center justify-center text-orange-600 mb-6">
              <TrendingUp className="w-10 h-10" />
           </div>
           <h2 className="text-2xl font-black mb-4">{pick(locale, 'بيانات محركات البحث', 'Search engine data')}</h2>
           <p className="text-muted-foreground dark:text-muted-foreground mb-8 max-w-md leading-relaxed font-medium">
             {pick(locale, 'سيتم ربط بيانات Search Console و Analytics فور توفر مفاتيح البيئة المخصصة لها.', 'Search Console and Analytics data will be connected when the required environment keys are available.')}
           </p>
           <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border text-[10px] font-black uppercase text-muted-foreground">{pick(locale, 'خاصية Google: جاهزة', 'G-Property: Ready')}</span>
              <span className="px-4 py-2 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border text-[10px] font-black uppercase text-muted-foreground">{pick(locale, 'الفهرسة: معلقة', 'Indexing: Pending')}</span>
           </div>
        </div>

        <div className="bg-brand-green p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
           <h2 className="text-2xl font-black mb-6 relative z-10">{pick(locale, 'حالة النظام الحالية', 'Current system status')}</h2>
           <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                 <span className="text-sm font-bold">{pick(locale, 'اتصال قاعدة البيانات', 'Database connection')}</span>
                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                 <span className="text-sm font-bold">{pick(locale, 'مزامنة API الرياضي', 'Sports API sync')}</span>
                 <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-yellow-400'}`}></span>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                 <span className="text-sm font-bold">{pick(locale, 'عنقود Redis', 'Redis cluster')}</span>
                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
              </div>
           </div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
        </div>
      </div>
    </div>
  );
}
