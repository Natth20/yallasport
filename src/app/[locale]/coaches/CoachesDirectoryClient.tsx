'use client';

import React, { useState, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { slugifyCoachName } from '@/lib/coaches/slug';
import {
  Briefcase,
  Search,
  ArrowUpRight,
  Trophy,
  Shield,
  User,
  X,
  Sparkles,
  Award,
} from 'lucide-react';
import styles from './coaches.module.css';

export interface CoachItem {
  id: string;
  name: string;
  photoUrl: string | null;
  nationality: string | null;
  bio: string | null;
  currentTeam: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  trophies: Array<{
    id: string;
    title: string;
    season: string | null;
  }>;
}

interface Props {
  locale: string;
  initialCoaches: CoachItem[];
  initialQuery?: string;
}

export function CoachesDirectoryClient({ locale, initialCoaches, initialQuery = '' }: Props) {
  const isAr = locale === 'ar';
  const [query, setQuery] = useState(initialQuery);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE_TEAM' | 'TROPHIES'>('ALL');

  const filteredCoaches = useMemo(() => {
    let list = initialCoaches;

    if (filterMode === 'ACTIVE_TEAM') {
      list = list.filter((c) => Boolean(c.currentTeam));
    } else if (filterMode === 'TROPHIES') {
      list = list.filter((c) => c.trophies.length > 0);
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.nationality || '').toLowerCase().includes(q) ||
          (c.currentTeam?.name || '').toLowerCase().includes(q) ||
          c.trophies.some((tr) => tr.title.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [initialCoaches, filterMode, query]);

  return (
    <div className={styles.directoryWrapper}>
      {/* Search & Filter Toolbar */}
      <div className={styles.toolbarSection}>
        <div className={styles.searchBarWrap}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث باسم المدرب، النادي الحالي، أو الجنسية (مثال: مورينيو، ريال مدريد، البرتغال)...'
                : 'Search coach by name, club, or nationality...'
            }
            className={styles.searchInput}
          />
          {query && (
            <button onClick={() => setQuery('')} className={styles.clearSearchBtn} title={isAr ? 'مسح' : 'Clear'}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Tabs */}
        <div className={styles.filterPillsTrack}>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`${styles.filterPill} ${filterMode === 'ALL' ? styles.filterPillActive : ''}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'كافة المدربين' : 'All Managers'}</span>
          </button>
          <button
            onClick={() => setFilterMode('ACTIVE_TEAM')}
            className={`${styles.filterPill} ${filterMode === 'ACTIVE_TEAM' ? styles.filterPillActive : ''}`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{isAr ? 'يقودون أندية حالياً' : 'Active Club Managers'}</span>
          </button>
          <button
            onClick={() => setFilterMode('TROPHIES')}
            className={`${styles.filterPill} ${filterMode === 'TROPHIES' ? styles.filterPillActive : ''}`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>{isAr ? 'أصحاب الألقاب والبطولات' : 'Trophy Winners'}</span>
          </button>
        </div>
      </div>

      {/* Results Header Count */}
      <div className={styles.countRow}>
        <span className={styles.countText}>
          {isAr
            ? `عرض ${filteredCoaches.length} مدرباً فنياً معتمداً`
            : `Showing ${filteredCoaches.length} verified football managers`}
        </span>
      </div>

      {/* Luxury Coaches Grid */}
      {filteredCoaches.length === 0 ? (
        <div className={styles.empty}>
          <Briefcase className={styles.emptyIcon} />
          <h3>{isAr ? 'لم نتمكن من العثور على مدربين مطابقين للبحث' : 'No managers found matching your search'}</h3>
          <p>{isAr ? 'جرب البحث باسم آخر أو إزالة التصفية.' : 'Try adjusting your search query or reset filters.'}</p>
          <button
            onClick={() => {
              setQuery('');
              setFilterMode('ALL');
            }}
            className={styles.resetBtn}
          >
            {isAr ? 'عرض كافة المدربين' : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCoaches.map((coach) => {
            const localizedName = localizePlainName(locale, coach.name);
            const coachSlug = slugifyCoachName(coach.name, coach.id);

            return (
              <article key={coach.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.avatarWrap}>
                    {coach.photoUrl ? (
                      <img
                        src={coach.photoUrl}
                        alt={localizedName}
                        className={styles.avatar}
                        loading="lazy"
                      />
                    ) : (
                      <User className={styles.avatarFallback} />
                    )}
                    {coach.currentTeam?.logoUrl && (
                      <img
                        src={coach.currentTeam.logoUrl}
                        alt={coach.currentTeam.name}
                        className={styles.teamMiniBadge}
                        title={coach.currentTeam.name}
                      />
                    )}
                  </div>

                  <div className={styles.meta}>
                    <h2 className={styles.coachName}>
                      <Link href={`/coach/${coachSlug}`} className={styles.coachLink}>
                        {localizedName}
                      </Link>
                    </h2>

                    <div className={styles.tags}>
                      {coach.nationality && (
                        <span className={styles.nationTag}>
                          🌍 {coach.nationality}
                        </span>
                      )}
                      {coach.trophies.length > 0 && (
                        <span className={styles.trophyTag}>
                          <Trophy className="h-3 w-3 text-amber-400" />
                          <span>
                            {coach.trophies.length} {isAr ? 'ألقاب' : 'Trophies'}
                          </span>
                        </span>
                      )}
                    </div>

                    {coach.currentTeam ? (
                      <Link href={`/team/${coach.currentTeam.slug}`} className={styles.teamTag}>
                        {coach.currentTeam.logoUrl ? (
                          <img
                            src={coach.currentTeam.logoUrl}
                            alt={coach.currentTeam.name}
                            className={styles.teamLogo}
                          />
                        ) : (
                          <Shield className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span>{coach.currentTeam.name}</span>
                      </Link>
                    ) : (
                      <span className={styles.unattachedTag}>
                        {isAr ? 'حر بدون نادٍ حالياً' : 'Currently Unattached'}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link href={`/coach/${coachSlug}`} className={styles.primaryAction}>
                    <span>{isAr ? 'السجل والملف الفني' : 'Tactical Dossier'}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
