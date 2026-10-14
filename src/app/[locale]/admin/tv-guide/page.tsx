import React from 'react';
import { prisma } from '@/lib/prisma';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { Link } from '@/i18n/navigation';
import { Tv, Radio, Mic, Plus, Trash2, ShieldCheck, CheckCircle2, Clock, Globe } from 'lucide-react';
import { linkMatchChannel, unlinkMatchChannel, setMatchCommentator, createChannel } from './actions';
import { toChannelSlug, VERIFIED_CHANNEL_FREQUENCIES } from '@/lib/channels/catalog';

export default async function AdminTVGuidePage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  const [matches, channels] = await Promise.all([
    prisma.match.findMany({
      where: { status: 'NOT_STARTED' },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        channels: { include: { channel: true } },
        commentators: true,
      },
      orderBy: { kickoffAt: 'asc' },
      take: 30,
    }),
    prisma.channel.findMany({
      include: {
        _count: { select: { matches: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs">
            <Tv className="h-3.5 w-3.5" />
            <span>{pick(locale, 'إدارة البث التلفزيوني وحقوق النقل', 'Broadcast & TV Management')}</span>
          </span>
        </div>
        <h1 className="text-2xl font-black text-brand-green dark:text-foreground">
          {pick(locale, 'لوحة إدارة القنوات الناقلة والمعلقين', 'TV Channels & Commentary Dashboard')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick(
            locale,
            'ربط القنوات والمعلقين المعتمدين بالمباريات الرسمية، ومراجعة الترددات المسجلة وحالات البيانات.',
            'Link verified TV channels and commentators to official fixtures, review satellite frequencies and data integrity.'
          )}
        </p>
      </div>

      {/* SECTION 1: ADD NEW CHANNEL */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm dark:bg-card">
        <h2 className="text-base font-black text-foreground mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-orange-500" />
          <span>{pick(locale, 'إضافة قناة رياضية جديدة للمنصة', 'Register New Sports Channel')}</span>
        </h2>
        <form action={createChannel} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              {pick(locale, 'اسم القناة *', 'Channel Name *')}
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. beIN Sports 3, SSC Extra 1"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              {pick(locale, 'دولة المنشأ / الإقليم', 'Country / Territory')}
            </label>
            <input
              type="text"
              name="country"
              placeholder="e.g. QA, SA, AE, EG"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              {pick(locale, 'رابط الشعار (Logo URL)', 'Logo URL')}
            </label>
            <input
              type="url"
              name="logoUrl"
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-black text-white hover:bg-orange-600 transition-colors"
            >
              {pick(locale, 'حفظ القناة', 'Save Channel')}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: MATCH ASSIGNMENTS TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Radio className="h-5 w-5 text-orange-500" />
            <span>{pick(locale, 'ربط القنوات والمعلقين بالمباريات القادمة', 'Link Channels & Commentators to Upcoming Matches')}</span>
          </h2>
          <span className="text-xs text-muted-foreground font-bold">
            {matches.length} {pick(locale, 'مباراة', 'matches')}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 text-start">{pick(locale, 'المباراة والبطولة', 'Match & League')}</th>
                  <th className="px-5 py-3.5 text-start">{pick(locale, 'القنوات المعينة', 'Assigned Channels')}</th>
                  <th className="px-5 py-3.5 text-start">{pick(locale, 'المعلق الصوتي', 'Commentator')}</th>
                  <th className="px-5 py-3.5 text-center">{pick(locale, 'إجراء الربط', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {matches.map((m) => (
                  <tr key={m.id} className="text-xs hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold">
                      <div className="text-foreground">{m.homeTeam.name} × {m.awayTeam.name}</div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-0.5">
                        {m.league.name} · {new Date(m.kickoffAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {m.channels.map((mc) => (
                          <span
                            key={mc.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          >
                            <span>{mc.channel.name}</span>
                            <form action={unlinkMatchChannel} className="inline">
                              <input type="hidden" name="matchId" value={m.id} />
                              <input type="hidden" name="channelId" value={mc.channel.id} />
                              <button
                                type="submit"
                                className="text-muted-foreground hover:text-red-500 ml-1"
                                title={pick(locale, 'حذف الربط', 'Unlink')}
                              >
                                ×
                              </button>
                            </form>
                          </span>
                        ))}
                        {m.channels.length === 0 && (
                          <span className="italic text-muted-foreground text-[11px]">
                            {pick(locale, 'لم تُعين بعد (PENDING)', 'Pending confirmation')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {m.commentators.length > 0 ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Mic className="h-3 w-3" />
                          <span>{m.commentators.map((c) => c.name).join('، ')}</span>
                        </div>
                      ) : (
                        <form action={setMatchCommentator} className="flex items-center gap-1">
                          <input type="hidden" name="matchId" value={m.id} />
                          <input
                            type="text"
                            name="name"
                            placeholder={pick(locale, 'اسم المعلق...', 'Commentator...')}
                            className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-[11px]"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 text-[10px] font-bold hover:bg-amber-500 hover:text-white"
                          >
                            {pick(locale, 'حفظ', 'Set')}
                          </button>
                        </form>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {channels.length > 0 && (
                        <form action={linkMatchChannel} className="flex items-center justify-center gap-1.5">
                          <input type="hidden" name="matchId" value={m.id} />
                          <select
                            name="channelId"
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                          >
                            {channels.map((channel) => (
                              <option key={channel.id} value={channel.id}>
                                {channel.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-orange-600"
                          >
                            {pick(locale, 'ربط', 'Link')}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: REGISTERED CHANNELS & FREQUENCIES SUMMARY */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span>{pick(locale, 'دليل القنوات المسجلة وحالات التحقق', 'Verified Channels & Registry Status')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map((ch) => {
            const slug = toChannelSlug(ch.name);
            const freq = VERIFIED_CHANNEL_FREQUENCIES[slug];
            return (
              <div
                key={ch.id}
                className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold text-sm text-foreground">{ch.name}</h3>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>{ch.country || 'Region'}</span>
                    <span>·</span>
                    <span className="text-orange-500 font-bold">{ch._count.matches} {pick(locale, 'مباراة', 'matches')}</span>
                  </div>
                  {freq ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{pick(locale, 'الترددات معتمدة', 'Frequencies verified')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{pick(locale, 'التردد قيد التحديث', 'Frequencies pending')}</span>
                    </span>
                  )}
                </div>

                <Link
                  href={`/channel/${slug}`}
                  className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-orange-500 hover:text-white transition-colors"
                >
                  {pick(locale, 'معاينة', 'Preview')}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
