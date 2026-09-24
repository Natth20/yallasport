import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { Star, Bell, ArrowLeft } from 'lucide-react';
import {Link} from '@/i18n/navigation';
import { MatchCard } from '@/components/sports/MatchCard';
import { MATCH_LIST_INCLUDE, toNormalizedMatch } from '@/lib/sports-data/from-db';
import {getTranslations} from 'next-intl/server';

/**
 * MyYallaSport - Personalized widget for logged-in users.
 */
export default async function MyYallaSport() {
  const t = await getTranslations('sports');
  const session = await auth();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: {
      favorites: { take: 5 }
    }
  });

  if (!user || user.favorites.length === 0) return null;

  const favoriteIds = user.favorites.map((favorite) => favorite.entityId);
  const liveRows = await prisma.match.findMany({
    where: {
      status: { in: ['LIVE', 'HALFTIME'] },
      OR: [
        { homeTeamId: { in: favoriteIds } },
        { awayTeamId: { in: favoriteIds } },
        { leagueId: { in: favoriteIds } },
        { id: { in: favoriteIds } },
      ],
    },
    take: 6,
    include: MATCH_LIST_INCLUDE,
  });
  const favoriteMatches = liveRows.map(toNormalizedMatch);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
      <div className="bg-orange-500 rounded-[3.5rem] p-12 md:p-16 text-primary-foreground shadow-2xl shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
             <div>
                <h2 className="text-4xl font-black mb-3 flex items-center gap-4">
                  <Star className="w-10 h-10 text-white fill-current" />
                  {t('my_space')}
                </h2>
                <p className="text-orange-100 font-bold opacity-80 uppercase tracking-widest text-[10px]">{t('welcome_user', {name: user.name || ''})}</p>
             </div>
             <Link href="/profile" className="bg-card text-orange-500 px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-3">
               {t('manage_preferences')}
               <ArrowLeft className="w-4 h-4" />
             </Link>
          </div>

          {favoriteMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {favoriteMatches.map(m => (
                 <div key={m.id} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-2">
                    <MatchCard match={m} />
                 </div>
               ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-10 text-center border border-white/10">
               <Bell className="w-10 h-10 text-orange-200 mx-auto mb-4 opacity-50" />
               <p className="font-bold opacity-80">{t('no_favorite_live')}</p>
            </div>
          )}
        </div>
        
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -mr-64 -mt-64"></div>
      </div>
    </section>
  );
}
