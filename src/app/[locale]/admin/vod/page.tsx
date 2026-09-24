// src/app/admin/vod/page.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { Film, Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { pick } from "@/i18n/pick";

export default async function AdminVODPage() {
  const locale = await getLocale();
  const shows = await prisma.show.findMany({
    include: { _count: { select: { episodes: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black dark:text-foreground">{pick(locale, 'إدارة المحتوى الترفيهي', 'Manage VOD content')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick(locale, 'عرض العروض المنشورة في القاعدة. لا تعديل من أزرار وهمية.', 'Shows stored in the database. Editing is not available on this screen.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {shows.map((show) => (
          <div key={show.id} className="bg-card dark:bg-muted p-6 rounded-3xl shadow-sm border border-border dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-20 bg-muted dark:bg-slate-700 rounded-xl overflow-hidden shadow-inner">
                {show.posterUrl ? (
                  <img src={show.posterUrl} alt={show.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-black text-lg dark:text-foreground">{show.title}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className="bg-muted dark:bg-slate-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-muted-foreground dark:text-muted-foreground">
                    {show.type}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold">
                    {show._count.episodes} {pick(locale, 'حلقة', 'episodes')}
                  </span>
                  <span className={`text-[10px] font-black uppercase ${show.status === 'PUBLISHED' ? 'text-green-500' : 'text-amber-500'}`}>
                    {show.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/vod/${show.slug}`} className="p-3 bg-muted dark:bg-slate-700 rounded-xl text-muted-foreground hover:text-orange-500 transition-all" title={pick(locale, 'معاينة', 'Preview')}>
                <Eye className="w-5 h-5" />
              </Link>
            </div>
          </div>
        ))}

        {shows.length === 0 && (
          <div className="py-20 text-center bg-muted dark:bg-background/50 rounded-[3rem] border-2 border-dashed border-border dark:border-gray-800">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-bold">{pick(locale, 'لا يوجد محتوى ترفيهي مضاف حالياً.', 'No VOD content has been added yet.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
