import React from 'react';
import { Layout, ToggleLeft, BarChart3 } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { AD_PLACEMENTS } from '@/lib/ads/catalog';
import { listAdSlotsForAdmin } from '@/lib/ads/load';
import { saveAdSlot, toggleAdSlot } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdsAdminPage() {
  const locale = await getLocale();
  const adSlots = await listAdSlotsForAdmin();
  const labels = new Map<string, string>(AD_PLACEMENTS.map((row) => [row.id, pick(locale, row.ar, row.en)]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة المساحات الإعلانية', 'Manage ad placements')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick(
            locale,
            'فعّل المساحة لتظهر فوراً على الموقع. أضف صورة ورابط، أو كود HTML آمناً، أو رقم خانة AdSense.',
            'Turn a placement on to show it immediately. Add an image and link, safe HTML, or an AdSense slot id.',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {adSlots.length > 0 ? (
          adSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex flex-col rounded-[2rem] border border-gray-50 bg-card p-8 shadow-xl dark:border-border dark:bg-background"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground dark:bg-muted">
                    <Layout className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{labels.get(slot.placement) || slot.placement}</h3>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {slot.placement} · {slot.isActive ? pick(locale, 'ظاهرة الآن', 'Live now') : pick(locale, 'متوقفة', 'Off')}
                    </p>
                  </div>
                </div>
                <form action={toggleAdSlot}>
                  <input type="hidden" name="id" value={slot.id} />
                  <button
                    type="submit"
                    className={`rounded-full p-2 transition-colors ${slot.isActive ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground'}`}
                    title={pick(locale, slot.isActive ? 'إيقاف' : 'تفعيل الآن', slot.isActive ? 'Disable' : 'Enable now')}
                  >
                    <ToggleLeft className={`h-8 w-8 ${slot.isActive ? 'rotate-180' : ''}`} />
                  </button>
                </form>
              </div>

              <form action={saveAdSlot} className="space-y-3 text-sm">
                <input type="hidden" name="id" value={slot.id} />
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">
                    {pick(locale, 'العنوان', 'Headline')}
                  </span>
                  <input
                    name="headline"
                    defaultValue={slot.headline ?? ''}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 font-semibold"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">
                    {pick(locale, 'رابط الصورة', 'Image URL')}
                  </span>
                  <input
                    name="imageUrl"
                    defaultValue={slot.imageUrl ?? ''}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 font-semibold"
                    dir="ltr"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">
                    {pick(locale, 'رابط النقر', 'Click URL')}
                  </span>
                  <input
                    name="linkUrl"
                    defaultValue={slot.linkUrl ?? ''}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 font-semibold"
                    dir="ltr"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">
                    AdSense slot
                  </span>
                  <input
                    name="adsenseSlot"
                    defaultValue={slot.adsenseSlot ?? ''}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 font-semibold"
                    dir="ltr"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase text-muted-foreground">
                    HTML
                  </span>
                  <textarea
                    name="html"
                    defaultValue={slot.html ?? ''}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 font-mono text-xs"
                    dir="ltr"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-foreground px-4 py-2 text-xs font-black text-background"
                >
                  {pick(locale, 'حفظ الإعلان', 'Save creative')}
                </button>
              </form>

              <div className="mt-6 grid grid-cols-2 gap-4">
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
