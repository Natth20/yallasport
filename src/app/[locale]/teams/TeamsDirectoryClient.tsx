'use client';

import React, { useState, useMemo } from 'react';
import { Shield, Search, ArrowUpRight, Scale, Trophy, Calendar, Users, Newspaper, Globe, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { localizeTeamName, localizePlainName } from '@/lib/i18n/sports-lexicon';
import styles from './teams.module.css';

export interface DirectoryTeam {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  founded: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  leagueName?: string | null;
  leagueSlug?: string | null;
  country?: string | null;
}

export interface ActiveLeague {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
}

interface TeamsDirectoryClientProps {
  teams: DirectoryTeam[];
  leagues: ActiveLeague[];
  locale: string;
}

export function TeamsDirectoryClient({ teams, leagues, locale }: TeamsDirectoryClientProps) {
  const ar = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const popularCountries = useMemo(
    () => [
      { key: 'all', label: ar ? 'كافة الدول' : 'All Countries', value: 'all' },
      { key: 'england', label: ar ? 'إنجلترا' : 'England', value: 'england' },
      { key: 'spain', label: ar ? 'إسبانيا' : 'Spain', value: 'spain' },
      { key: 'italy', label: ar ? 'إيطاليا' : 'Italy', value: 'italy' },
      { key: 'germany', label: ar ? 'ألمانيا' : 'Germany', value: 'germany' },
      { key: 'france', label: ar ? 'فرنسا' : 'France', value: 'france' },
      { key: 'saudi', label: ar ? 'السعودية' : 'Saudi Arabia', value: 'saudi' },
      { key: 'egypt', label: ar ? 'مصر' : 'Egypt', value: 'egypt' },
    ],
    [ar]
  );

  // Filter teams based on search query, league, and country
  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teams.filter((t) => {
      // League match
      if (selectedLeague !== 'all' && t.leagueSlug !== selectedLeague) {
        return false;
      }

      // Country match
      if (selectedCountry !== 'all') {
        const countryNorm = (t.country || t.venueCity || '').toLowerCase();
        if (selectedCountry === 'england' && !countryNorm.includes('england') && !countryNorm.includes('إنجلترا')) return false;
        if (selectedCountry === 'spain' && !countryNorm.includes('spain') && !countryNorm.includes('إسبانيا')) return false;
        if (selectedCountry === 'italy' && !countryNorm.includes('italy') && !countryNorm.includes('إيطاليا')) return false;
        if (selectedCountry === 'germany' && !countryNorm.includes('germany') && !countryNorm.includes('ألمانيا')) return false;
        if (selectedCountry === 'france' && !countryNorm.includes('france') && !countryNorm.includes('فرنسا')) return false;
        if (selectedCountry === 'saudi' && !countryNorm.includes('saudi') && !countryNorm.includes('السعودية')) return false;
        if (selectedCountry === 'egypt' && !countryNorm.includes('egypt') && !countryNorm.includes('مصر')) return false;
      }

      // Search query
      if (q) {
        const nameMatch = t.name.toLowerCase().includes(q);
        const slugMatch = t.slug.toLowerCase().includes(q);
        const localized = localizeTeamName(locale, t.name).toLowerCase();
        const localizedMatch = localized.includes(q);
        const leagueMatch = (t.leagueName || '').toLowerCase().includes(q);
        return nameMatch || slugMatch || localizedMatch || leagueMatch;
      }

      return true;
    });
  }, [teams, searchQuery, selectedLeague, selectedCountry, locale]);

  return (
    <div className={styles.clientRoot}>
      {/* Search Bar with instant reaction */}
      <div className={styles.searchBarWrapper}>
        <div className={styles.searchForm}>
          <Search className={styles.searchIcon} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ar ? 'ابحث فورياً عن أي نادٍ أو فريق بالاسم...' : 'Search clubs instantly by name...'}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchBtn}
              title={ar ? 'مسح البحث' : 'Clear search'}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Section: Leagues & Countries */}
      <div className={styles.filterSection}>
        {/* League Filters */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            <Trophy className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
            {ar ? 'البطولة:' : 'League:'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedLeague('all')}
            className={`${styles.filterChip} ${selectedLeague === 'all' ? styles.filterChipActive : ''}`}
          >
            {ar ? 'كافة البطولات' : 'All Leagues'}
          </button>
          {leagues.map((lg) => {
            const active = selectedLeague === lg.slug;
            return (
              <button
                type="button"
                key={lg.id}
                onClick={() => setSelectedLeague(active ? 'all' : lg.slug)}
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
              >
                {localizePlainName(locale, lg.name)}
              </button>
            );
          })}
        </div>

        {/* Country Filters */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            <Globe className="inline h-3.5 w-3.5 text-blue-400 mr-1" />
            {ar ? 'الدولة:' : 'Country:'}
          </span>
          {popularCountries.map((c) => {
            const active = selectedCountry === c.value;
            return (
              <button
                type="button"
                key={c.key}
                onClick={() => setSelectedCountry(c.value)}
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className={styles.resultsBar}>
        <div className={styles.resultsInfo}>
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span>
            {ar
              ? `عرض ${filteredTeams.length} نادٍ رياضي معتمد`
              : `Showing ${filteredTeams.length} verified football clubs`}
          </span>
        </div>
        {(searchQuery || selectedLeague !== 'all' || selectedCountry !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedLeague('all');
              setSelectedCountry('all');
            }}
            className={styles.resetButton}
          >
            {ar ? 'إعادة ضبط التصفية' : 'Reset Filters'}
          </button>
        )}
      </div>

      {/* Grid of Teams */}
      <section className={styles.grid}>
        {filteredTeams.length === 0 ? (
          <div className={styles.empty}>
            <Shield className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              {ar ? 'لم يتم العثور على أندية مطابقة للتصفية أو البحث' : 'No clubs found matching your search or filters'}
            </p>
            <p className={styles.emptySubtitle}>
              {ar ? 'جرب البحث باسم نادٍ آخر أو قم بإلغاء بعض الفلاتر' : 'Try searching for another club or clearing filters'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedLeague('all');
                setSelectedCountry('all');
              }}
              className={styles.resetLinkBtn}
            >
              {ar ? 'عرض كافة الأندية المعتمدة' : 'View all verified clubs'}
            </button>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const localizedName = localizeTeamName(locale, team.name);
            const location = team.venueCity || team.country;

            return (
              <article key={team.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.crestWrap}>
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={localizedName}
                        className={styles.crest}
                        loading="lazy"
                      />
                    ) : (
                      <Shield className={styles.crestFallback} />
                    )}
                  </div>
                  <div className={styles.meta}>
                    <h2 className={styles.teamName}>
                      <Link href={`/team/${team.slug}`} className={styles.teamLink}>
                        {localizedName}
                      </Link>
                    </h2>
                    {team.leagueName && (
                      <Link
                        href={team.leagueSlug ? `/league/${team.leagueSlug}` : `/teams?league=${team.leagueSlug}`}
                        className={styles.leagueTag}
                      >
                        <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="truncate">{localizePlainName(locale, team.leagueName)}</span>
                      </Link>
                    )}
                    {location && (
                      <span className={styles.countryTag}>
                        <Globe className="h-2.5 w-2.5 inline mr-1 text-blue-400" />
                        {localizePlainName(locale, location)}
                        {team.founded ? ` · ${ar ? 'تأسس' : 'Est.'} ${team.founded}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct quick links to Matches, Squad/Players, News */}
                <div className={styles.subLinks}>
                  <Link
                    href={`/team/${team.slug}#fixtures`}
                    className={styles.subLink}
                    title={ar ? 'مواعيد ونتائج مباريات الفريق' : 'Team matches & schedule'}
                  >
                    <Calendar className="h-3.5 w-3.5 text-orange-500" />
                    <span>{ar ? 'المباريات' : 'Matches'}</span>
                  </Link>
                  <Link
                    href={`/team/${team.slug}#squad`}
                    className={styles.subLink}
                    title={ar ? 'قائمة وتشكيلة لاعبي الفريق' : 'Team squad & roster'}
                  >
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    <span>{ar ? 'اللاعبون' : 'Players'}</span>
                  </Link>
                  <Link
                    href={`/team/${team.slug}#news`}
                    className={styles.subLink}
                    title={ar ? 'أخبار وتقارير النادي' : 'Team news & reports'}
                  >
                    <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{ar ? 'الأخبار' : 'News'}</span>
                  </Link>
                </div>

                <div className={styles.actions}>
                  <Link href={`/team/${team.slug}`} className={styles.primaryAction}>
                    <span>{ar ? 'ملف النادي' : 'Club Profile'}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/compare?t1=${team.slug}`}
                    className={styles.secondaryAction}
                    title={ar ? 'مقارنة النادي' : 'Compare Club'}
                  >
                    <Scale className="h-3.5 w-3.5 text-amber-400" />
                    <span>{ar ? 'مقارنة' : 'Compare'}</span>
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
