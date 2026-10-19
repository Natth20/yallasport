'use client';

import React, { useState, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import {
  User,
  Search,
  ArrowUpRight,
  Scale,
  Activity,
  X,
  Sparkles,
  Shield,
  Flame,
  Award,
} from 'lucide-react';
import styles from './players.module.css';

export interface PlayerItem {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  position: string | null;
  nationality: string | null;
  teams: Array<{
    team: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
    };
  }>;
}

interface Props {
  locale: string;
  initialPlayers: PlayerItem[];
  initialQuery?: string;
}

export function PlayersDirectoryClient({ locale, initialPlayers, initialQuery = '' }: Props) {
  const isAr = locale === 'ar';
  const [query, setQuery] = useState(initialQuery);
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');

  const positions = useMemo(() => {
    return [
      { key: 'ALL', labelAr: 'كافة المراكز', labelEn: 'All Positions', icon: Sparkles },
      { key: 'Attacker', labelAr: 'الهجوم', labelEn: 'Attackers', icon: Flame, color: '#f97316' },
      { key: 'Midfielder', labelAr: 'خط الوسط', labelEn: 'Midfielders', icon: Activity, color: '#06b6d4' },
      { key: 'Defender', labelAr: 'الدفاع', labelEn: 'Defenders', icon: Shield, color: '#3b82f6' },
      { key: 'Goalkeeper', labelAr: 'حراسة المرمى', labelEn: 'Goalkeepers', icon: Award, color: '#eab308' },
    ];
  }, []);

  const filteredPlayers = useMemo(() => {
    let list = initialPlayers;

    if (selectedPosition !== 'ALL') {
      list = list.filter((p) => {
        const pos = (p.position || '').toLowerCase();
        if (selectedPosition === 'Attacker') return pos.includes('attack') || pos.includes('forward') || pos.includes('winger');
        if (selectedPosition === 'Midfielder') return pos.includes('midfield');
        if (selectedPosition === 'Defender') return pos.includes('defend') || pos.includes('back');
        if (selectedPosition === 'Goalkeeper') return pos.includes('goal') || pos.includes('keeper');
        return true;
      });
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.nationality || '').toLowerCase().includes(q) ||
          (p.teams?.[0]?.team.name || '').toLowerCase().includes(q),
      );
    }

    return list;
  }, [initialPlayers, selectedPosition, query]);

  const getPositionBadge = (pos: string | null) => {
    if (!pos) return null;
    const lower = pos.toLowerCase();
    let colorClass = styles.posGeneral;
    let label = pos;

    if (lower.includes('attack') || lower.includes('forward') || lower.includes('winger')) {
      colorClass = styles.posAttacker;
      label = isAr ? 'مهاجم' : 'Attacker';
    } else if (lower.includes('midfield')) {
      colorClass = styles.posMidfielder;
      label = isAr ? 'خط وسط' : 'Midfielder';
    } else if (lower.includes('defend') || lower.includes('back')) {
      colorClass = styles.posDefender;
      label = isAr ? 'مدافع' : 'Defender';
    } else if (lower.includes('goal') || lower.includes('keeper')) {
      colorClass = styles.posKeeper;
      label = isAr ? 'حارس مرمى' : 'Goalkeeper';
    }

    return (
      <span className={`${styles.positionBadge} ${colorClass}`}>
        <Activity className="h-3 w-3" />
        <span>{label}</span>
      </span>
    );
  };

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
                ? 'ابحث بالاسم، النادي، أو الجنسية (مثال: يامال، ريال مدريد، إسبانيا)...'
                : 'Search by player name, club, or nationality...'
            }
            className={styles.searchInput}
          />
          {query && (
            <button onClick={() => setQuery('')} className={styles.clearSearchBtn} title={isAr ? 'مسح' : 'Clear'}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Position Pills */}
        <div className={styles.positionPillsTrack}>
          {positions.map((item) => {
            const Icon = item.icon;
            const active = selectedPosition === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedPosition(item.key)}
                className={`${styles.positionPill} ${active ? styles.positionPillActive : ''}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{isAr ? item.labelAr : item.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header Count */}
      <div className={styles.countRow}>
        <span className={styles.countText}>
          {isAr
            ? `عرض ${filteredPlayers.length} لاعباً من نخبة كرة القدم`
            : `Showing ${filteredPlayers.length} verified football stars`}
        </span>
      </div>

      {/* Luxury Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className={styles.empty}>
          <User className={styles.emptyIcon} />
          <h3>{isAr ? 'لم نتمكن من العثور على لاعبين مطابقين للبحث' : 'No players found matching your search'}</h3>
          <p>{isAr ? 'جرب البحث باسم آخر أو اختر مركزا مختلفا.' : 'Try adjusting your search query or position filter.'}</p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedPosition('ALL');
            }}
            className={styles.resetBtn}
          >
            {isAr ? 'عرض كافة النجوم' : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPlayers.map((player) => {
            const currentTeam = player.teams?.[0]?.team;
            const localizedName = localizePlainName(locale, player.name);

            return (
              <article key={player.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.avatarWrap}>
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={localizedName}
                        className={styles.avatar}
                        loading="lazy"
                      />
                    ) : (
                      <User className={styles.avatarFallback} />
                    )}
                    {currentTeam?.logoUrl && (
                      <img
                        src={currentTeam.logoUrl}
                        alt={currentTeam.name}
                        className={styles.teamMiniBadge}
                        title={currentTeam.name}
                      />
                    )}
                  </div>

                  <div className={styles.meta}>
                    <h2 className={styles.playerName}>
                      <Link href={`/player/${player.slug}`} className={styles.playerLink}>
                        {localizedName}
                      </Link>
                    </h2>

                    <div className={styles.tags}>
                      {getPositionBadge(player.position)}
                      {player.nationality && (
                        <span className={styles.nationTag}>
                          🌍 {player.nationality}
                        </span>
                      )}
                    </div>

                    {currentTeam && (
                      <Link href={`/team/${currentTeam.slug}`} className={styles.teamTag}>
                        {currentTeam.logoUrl ? (
                          <img
                            src={currentTeam.logoUrl}
                            alt={currentTeam.name}
                            className={styles.teamLogo}
                          />
                        ) : (
                          <Shield className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span>{currentTeam.name}</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link href={`/player/${player.slug}`} className={styles.primaryAction}>
                    <span>{isAr ? 'الملف والإحصائيات' : 'Profile & Stats'}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/compare-players?p1=${player.slug}`}
                    className={styles.secondaryAction}
                    title={isAr ? 'مقارنة اللاعب' : 'Compare Player'}
                  >
                    <Scale className="h-4 w-4" />
                    <span>{isAr ? 'مقارنة' : 'Compare'}</span>
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
