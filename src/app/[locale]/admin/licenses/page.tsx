import React from 'react';
import { prisma } from '@/lib/prisma';
import { format, differenceInDays } from 'date-fns';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { createLicense, setLicenseStatus } from './actions';

/**
 * LicensesAdminPage - Management interface for legal licenses.
 * Restricted to Super Admins. Handles CRUD for streaming, data, and content licenses.
 */
export default async function LicensesAdminPage() {
  const locale = await getLocale();
  const licenses = await prisma.license.findMany({
    orderBy: { endDate: 'asc' }
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-foreground dark:text-foreground">{pick(locale, 'إدارة التراخيص', 'Manage licenses')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{pick(locale, 'سجّل عقداً برقم مرجعي. لا تُخزَّن مفاتيح المزوّد هنا.', 'Store a contract with a reference number. Vendor keys stay in env.')}</p>
      </div>

      <form action={createLicense} className="grid gap-3 rounded-[2rem] border border-border bg-card p-6 dark:border-border sm:grid-cols-2 lg:grid-cols-3">
        <select name="type" className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold" defaultValue="DATA">
          <option value="DATA">DATA</option>
          <option value="CONTENT">CONTENT</option>
          <option value="STREAMING">STREAMING</option>
        </select>
        <input name="provider" placeholder={pick(locale, 'الجهة', 'Provider')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <input name="scope" required placeholder={pick(locale, 'النطاق (دوري/موسم)', 'Scope')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <input name="contractReference" placeholder={pick(locale, 'رقم العقد', 'Contract ref')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <input name="apiCredentialsRef" placeholder={pick(locale, 'اسم متغير البيئة فقط', 'Env var name only')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <input type="date" name="startDate" required className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <input type="date" name="endDate" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <button type="submit" className="rounded-xl bg-foreground px-4 py-2 text-sm font-black text-white sm:col-span-2 lg:col-span-3">
          {pick(locale, 'إضافة ترخيص', 'Add license')}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-6">
        {licenses.length > 0 ? (
          licenses.map((license) => {
            const daysLeft = license.endDate ? differenceInDays(new Date(license.endDate), new Date()) : null;
            const isNearExpiry = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
            const isExpired = license.endDate && new Date(license.endDate) < new Date();

            return (
              <div key={license.id} className={`bg-card dark:bg-background p-8 rounded-[2rem] shadow-xl border-2 transition-all ${isExpired ? 'border-red-100 dark:border-red-950/20' : isNearExpiry ? 'border-orange-100 dark:border-orange-950/20' : 'border-gray-50 dark:border-border'}`}>
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  <div className="flex gap-6">
                    <div className={`p-4 rounded-3xl shrink-0 h-fit ${isExpired ? 'bg-red-50 dark:bg-red-950/20 text-red-500' : 'bg-brand-green/10 text-brand-green'}`}>
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black">{license.provider || pick(locale, 'جهة غير محددة', 'Unspecified provider')}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${license.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                          {license.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm font-bold uppercase tracking-tight">{license.type} - {license.scope}</p>
                      {license.contractReference ? (
                        <p className="text-xs text-muted-foreground">{pick(locale, 'مرجع:', 'Ref:')} {license.contractReference}</p>
                      ) : null}
                      {license.apiCredentialsRef ? (
                        <p className="text-xs text-muted-foreground">{pick(locale, 'مفتاح البيئة:', 'Env key:')} {license.apiCredentialsRef}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted dark:bg-muted px-3 py-1.5 rounded-xl">
                          <Clock className="w-3.5 h-3.5" />
                          {pick(locale, 'ينتهي في:', 'Expires:')} {license.endDate ? format(license.endDate, 'dd/MM/yyyy') : pick(locale, 'غير محدد', 'Unspecified')}
                        </div>
                        {isNearExpiry && (
                          <div className="flex items-center gap-2 text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-1.5 rounded-xl animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {pick(locale, 'تنبيه: الترخيص يقترب من الانتهاء', 'Warning: license expires soon')} ({daysLeft} {pick(locale, 'يوم', 'days')})
                          </div>
                        )}
                        {isExpired && (
                          <div className="flex items-center gap-2 text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {pick(locale, 'منتهي الصلاحية', 'Expired')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED'] as const).map((status) => (
                        <form action={setLicenseStatus} key={status}>
                          <input type="hidden" name="id" value={license.id} />
                          <input type="hidden" name="status" value={status} />
                          <button
                            type="submit"
                            className="rounded-lg border border-border px-3 py-1 text-[10px] font-black hover:bg-muted"
                          >
                            {status}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-card dark:bg-background p-20 rounded-[3rem] text-center border-2 border-dashed border-border dark:border-border">
            <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-muted-foreground">{pick(locale, 'لا توجد تراخيص مسجلة حالياً', 'No licenses registered')}</h3>
            <p className="text-muted-foreground text-sm mt-2">{pick(locale, 'استخدم النموذج أعلاه لتسجيل عقد حقيقي.', 'Use the form above to register a real contract.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
