import React from 'react';
import { prisma } from '@/lib/prisma';
import { Layout, ToggleLeft, BarChart3, Plus, Settings } from 'lucide-react';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * AdsAdminPage - Management for Ad slots across the platform.
 * Enables/disables slots and monitors performance metrics (Impressions/Clicks).
 */
export default async function AdsAdminPage() {
  const locale = await getLocale();
  const adSlots = await prisma.adSlot.findMany();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">{pick(locale, 'إدارة المساحات الإعلانية', 'Manage ad placements')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{pick(locale, 'تحكم في ظهور الإعلانات ومتابعة أداء كل مساحة بشكل مستقل.', 'Control ad visibility and monitor each placement independently.')}</p>
        </div>
        <button className="bg-brand-green text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-green-900/20">
          <Plus className="w-5 h-5" />
          {pick(locale, 'إضافة مساحة جديدة', 'Add placement')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {adSlots.length > 0 ? (
          adSlots.map((slot) => (
            <div key={slot.id} className="bg-card dark:bg-background rounded-[2rem] shadow-xl border border-gray-50 dark:border-border p-8 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-muted dark:bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">
                  <Layout className="w-8 h-8" />
                </div>
                <button className={`p-2 rounded-full transition-colors ${slot.isActive ? 'text-green-500 bg-green-50' : 'text-muted-foreground bg-muted'}`}>
                  <ToggleLeft className={`w-8 h-8 ${slot.isActive ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <h3 className="text-xl font-black mb-1">{slot.placement}</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-8">{pick(locale, 'سطح المكتب / الجوال', 'Desktop / Mobile')}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted dark:bg-muted p-4 rounded-2xl border border-border dark:border-border">
                  <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">{pick(locale, 'المشاهدات', 'Impressions')}</span>
                  <span className="text-lg font-black tabular-nums">{slot.impressions.toLocaleString()}</span>
                </div>
                <div className="bg-muted dark:bg-muted p-4 rounded-2xl border border-border dark:border-border">
                  <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">{pick(locale, 'النقرات', 'Clicks')}</span>
                  <span className="text-lg font-black tabular-nums">{slot.clicks.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-50 dark:border-border flex gap-4">
                <button className="flex-1 bg-background text-white dark:bg-card dark:text-foreground py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" />
                  {pick(locale, 'الإعدادات', 'Settings')}
                </button>
                <button className="p-3 bg-orange-50 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-primary-foreground transition-all">
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-muted dark:bg-background/50 rounded-[3rem] border-2 border-dashed border-border dark:border-border">
             <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-6" />
             <h2 className="text-xl font-black text-muted-foreground">{pick(locale, 'لا توجد مساحات إعلانية مسجلة', 'No ad placements registered')}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
