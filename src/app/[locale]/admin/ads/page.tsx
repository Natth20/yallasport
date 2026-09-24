import React from 'react';
import { prisma } from '@/lib/prisma';
import { Layout, ToggleLeft, BarChart3 } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { toggleAdSlot } from './actions';

export default async function AdsAdminPage() {
  const locale = await getLocale();
  const adSlots = await prisma.adSlot.findMany();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة المساحات الإعلانية', 'Manage ad placements')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick(
            locale,
            'تفعيل أو إيقاف المساحات الموجودة. لا إنشاء مساحات من هذه الشاشة.',
            'Toggle existing placements on or off. New slots are not created here.',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {adSlots.length > 0 ? (
          adSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex flex-col rounded-[2rem] border border-gray-50 bg-card p-8 shadow-xl dark:border-border dark:bg-background"
            >
              <div className="mb-8 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground dark:bg-muted">
                  <Layout className="h-8 w-8" />
                </div>
                <form action={toggleAdSlot}>
                  <input type="hidden" name="id" value={slot.id} />
                  <button
                    type="submit"
                    className={`rounded-full p-2 transition-colors ${slot.isActive ? 'bg-green-50 text-green-500' : 'bg-muted text-muted-foreground'}`}
                    title={pick(locale, slot.isActive ? 'إيقاف' : 'تفعيل', slot.isActive ? 'Disable' : 'Enable')}
                  >
                    <ToggleLeft className={`h-8 w-8 ${slot.isActive ? 'rotate-180' : ''}`} />
                  </button>
                </form>
              </div>

              <h3 className="mb-1 text-xl font-black">{slot.placement}</h3>
              <p className="mb-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {slot.isActive ? pick(locale, 'نشطة', 'Active') : pick(locale, 'متوقفة', 'Inactive')}
              </p>

              <div className="mb-2 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-muted p-4 dark:border-border dark:bg-muted">
                  <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">
                    {pick(locale, 'المشاهدات', 'Impressions')}
                  </span>
                  <span className="text-lg font-black tabular-nums">{slot.impressions.toLocaleString()}</span>
                </div>
                <div className="rounded-2xl border border-border bg-muted p-4 dark:border-border dark:bg-muted">
                  <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">
                    {pick(locale, 'النقرات', 'Clicks')}
                  </span>
                  <span className="text-lg font-black tabular-nums">{slot.clicks.toLocaleString()}</span>
                </div>
              </div>
              <p className="mt-auto pt-4 text-[10px] font-medium text-muted-foreground">
                {pick(locale, 'الأرقام من القاعدة كما سُجّلت.', 'Counts are stored values from the database.')}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-[3rem] border-2 border-dashed border-border bg-muted py-20 text-center dark:border-border dark:bg-background/50">
            <BarChart3 className="mx-auto mb-6 h-16 w-16 text-gray-200" />
            <h2 className="text-xl font-black text-muted-foreground">
              {pick(locale, 'لا توجد مساحات إعلانية مسجلة', 'No ad placements registered')}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
