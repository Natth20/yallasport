import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontTape } from '@/lib/front/load-tape';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { Radio, Zap, Flame, Sparkles } from 'lucide-react';
import styles from './front-hero-live.module.css';

export async function FrontLiveTicker() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const [board, stories, tape] = await Promise.all([
    loadFrontBoard(locale),
    loadFrontStories(locale),
    loadFrontTape(locale),
  ]);

  const live = board.filter((match) => isLiveStatus(match.status)).slice(0, 6);
  const goal = tape[0];
  const story = stories.lead || stories.rest[0];
  const items = [
    ...live.map((match) => ({
      key: match.id,
      href: `/match/${match.id}`,
      text: `${match.homeTeam.name} ${match.homeScore ?? 0}–${match.awayScore ?? 0} ${match.awayTeam.name}${
        match.minute != null ? ` · ${match.minute}′` : ''
      }`,
      tone: 'live' as const,
    })),
    ...(goal
      ? [
          {
            key: goal.id,
            href: `/match/${goal.matchId}`,
            text: ar
              ? `هدف: ${goal.player || 'هدف'} — ${goal.home} × ${goal.away} (${goal.minute}′)`
              : `Goal: ${goal.player || 'Goal'} — ${goal.home} vs ${goal.away} (${goal.minute}′)`,
            tone: 'goal' as const,
          },
        ]
      : []),
    ...(story
      ? [
          {
            key: story.id,
            href: `/news/${story.slug}`,
            text: ar ? `عاجل: ${story.title}` : `Breaking: ${story.title}`,
            tone: 'news' as const,
          },
        ]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <div className={styles.cyberTickerWrap} aria-label={ar ? 'شريط النبض الحي والمباريات' : 'Live pulse ticker'}>
      <span className={styles.tickerLivePill}>
        <span className={styles.pulsingRadarDot} />
        {ar ? 'مباشر الآن' : 'LIVE PULSE'}
      </span>
      <div className={styles.tickerScrollTrack}>
        {items.map((item) => {
          const toneClass =
            item.tone === 'live'
              ? styles.tickerToneLive
              : item.tone === 'goal'
                ? styles.tickerToneGoal
                : styles.tickerToneNews;
          return (
            <Link key={item.key} href={item.href} className={`${styles.tickerItemCapsule} ${toneClass}`}>
              {item.tone === 'live' && <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
              {item.tone === 'goal' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
              {item.tone === 'news' && <Flame className="w-3.5 h-3.5 text-sky-400" />}
              <span>{item.text}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
