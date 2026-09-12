import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Shield, User, Info, Trophy, Calendar, Globe, Award, TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';


/**
 * CoachPage - Detailed profile of a football manager.
 * Displays bio, career history, and trophies.
 */
export default async function CoachPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug } = await params;
  const coach = await prisma.coach.findUnique({
    where: { id: slug }, 
    include: {
      currentTeam: true,
      trophies: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!coach) notFound();

  const careerHistory = (coach.careerHistory as any[]) || [];

  const coachSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': coach.name,
    'description': coach.bio,
    'image': coach.photoUrl,
    'nationality': coach.nationality,
    'memberOf': coach.currentTeam ? {
      '@type': 'SportsTeam',
      'name': coach.currentTeam.name,
    } : undefined
  };

  return (
    <div className="pb-24">
      <JsonLd data={coachSchema} />
      
      {/* Dynamic Header */}
      <section className="bg-brand-green text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-[3rem] border-2 border-white/20 flex items-center justify-center backdrop-blur-xl overflow-hidden relative shadow-2xl group">
              {coach.photoUrl ? (
                <img src={coach.photoUrl} alt={coach.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <User className="w-24 h-24 opacity-20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>

            <div className="text-center md:text-right flex-1">
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">{coach.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-8">
                {coach.currentTeam && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-1">{pick(locale, 'النادي الحالي', 'Current club')}</span>
                    <span className="flex items-center gap-3 text-xl font-bold">
                      <Shield className="w-6 h-6" />
                      {coach.currentTeam.name}
                    </span>
                  </div>
                )}
                {coach.nationality && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-1">{pick(locale, 'الجنسية', 'Nationality')}</span>
                    <span className="flex items-center gap-3 text-xl font-bold">
                      <Globe className="w-6 h-6" />
                      {coach.nationality}
                    </span>
                  </div>
                )}
                {coach.birthDate && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-1">{pick(locale, 'تاريخ الميلاد', 'Date of birth')}</span>
                    <span className="flex items-center gap-3 text-xl font-bold">
                      <Calendar className="w-6 h-6" />
                      {format(new Date(coach.birthDate), 'dd MMMM yyyy', { locale: locale === 'ar' ? ar : enUS })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] -mr-96 -mt-96"></div>
      </section>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Bio Section */}
            <div className="bg-card dark:bg-background rounded-[3rem] p-10 md:p-16 shadow-xl border border-gray-50 dark:border-border">
              <h2 className="text-3xl font-black mb-10 flex items-center gap-4">
                <div className="w-2 h-10 bg-orange-500 rounded-full"></div>
                {pick(locale, 'السيرة الذاتية والمسيرة', 'Biography and career')}
              </h2>
              <div className="prose prose-xl dark:prose-invert max-w-none font-medium leading-relaxed text-foreground dark:text-muted-foreground">
                {coach.bio || `${pick(locale, 'لا توجد تفاصيل متوفرة حالياً عن مسيرة المدرب', 'No career details are currently available for coach')} ${coach.name}.`}
              </div>
            </div>

            {/* Career History Section */}
            <div className="bg-card dark:bg-background rounded-[3rem] p-10 shadow-xl border border-gray-50 dark:border-border">
              <h2 className="text-2xl font-black mb-10 flex items-center gap-4">
                <History className="w-8 h-8 text-orange-500" />
                {pick(locale, 'تاريخ المسيرة التدريبية', 'Coaching career history')}
              </h2>
              <div className="space-y-6">
                {careerHistory.length > 0 ? careerHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-8 bg-muted dark:bg-muted/50 rounded-[2rem] group hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all border border-transparent hover:border-orange-100">
                    <div className="flex items-center gap-8">
                       <div className="w-16 h-16 bg-card dark:bg-slate-700 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🏟️</div>
                       <div>
                          <h4 className="text-xl font-black mb-1">{item.club}</h4>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.from} - {item.to || pick(locale, 'الآن', 'Present')}</span>
                       </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                       <span className="text-[10px] font-black text-orange-500 uppercase mb-1">{pick(locale, 'نسبة الفوز', 'Win Rate')}</span>
                       <span className="text-2xl font-black text-foreground dark:text-foreground">{item.winRate || '--'}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-muted-foreground font-bold italic">{pick(locale, 'لا توجد بيانات تاريخية متاحة', 'No historical data available')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-10">

            {/* Trophies Widget */}
            <div className="bg-card dark:bg-background text-foreground dark:text-foreground rounded-[3.5rem] p-10 shadow-xl border border-border dark:border-border relative overflow-hidden">
               <h3 className="text-2xl font-black mb-10 flex items-center gap-4 relative z-10">
                  <Award className="w-8 h-8 text-orange-500" />
                  {pick(locale, 'البطولات والألقاب', 'Trophies and honours')}
               </h3>
               <div className="space-y-6 relative z-10">
                  {coach.trophies.length > 0 ? coach.trophies.map((trophy) => (
                    <div key={trophy.id} className="bg-muted dark:bg-card/[0.04] p-6 rounded-3xl border border-border dark:border-border hover:border-orange-200 dark:hover:bg-white/10 transition-all">
                       <div className="flex items-center gap-4 mb-2">
                          <Trophy className="w-5 h-5 text-orange-500" />
                          <span className="text-md font-black text-foreground dark:text-foreground">{trophy.title}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <span>{trophy.teamName}</span>
                          <span className="text-orange-500">{trophy.season}</span>
                       </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 opacity-40 italic">{pick(locale, 'لا توجد ألقاب مسجلة', 'No honours recorded')}</div>
                  )}
               </div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -mb-32 -mr-32 pointer-events-none"></div>
            </div>

            {/* Stats Summary */}
            <div className="bg-card dark:bg-background rounded-[3rem] p-10 shadow-xl border border-gray-50 dark:border-border">
               <h3 className="text-xl font-black mb-10 flex items-center gap-4">
                  <TrendingUp className="w-7 h-7 text-orange-500" />
                  {pick(locale, 'إحصائيات إجمالية', 'Overall statistics')}
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: pick(locale, 'إجمالي المباريات', 'Total matches'), value: '0', color: 'bg-blue-500' },
                    { label: pick(locale, 'نسبة الفوز', 'Win rate'), value: '0%', color: 'bg-green-500' },
                    { label: pick(locale, 'إجمالي الألقاب', 'Total honours'), value: coach.trophies.length.toString(), color: 'bg-orange-500' },
                    { label: pick(locale, 'سنوات الخبرة', 'Years of experience'), value: '0', color: 'bg-purple-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-muted dark:bg-muted/50 p-6 rounded-3xl text-center">
                       <span className="text-[10px] font-black text-muted-foreground block mb-2 uppercase tracking-tighter">{stat.label}</span>
                       <span className="text-2xl font-black text-foreground dark:text-foreground">{stat.value}</span>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
