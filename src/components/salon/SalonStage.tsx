import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { HeroEnter, Reveal } from '@/components/motion/PageMotion';
import styles from './salon.module.css';

export type SalonTone =
  | 'vault'
  | 'gallery'
  | 'podium'
  | 'wire'
  | 'booth'
  | 'seek'
  | 'press'
  | 'reel'
  | 'frame'
  | 'market'
  | 'ledger'
  | 'scale'
  | 'wager'
  | 'night'
  | 'charter'
  | 'lamp'
  | 'post'
  | 'deed'
  | 'keep'
  | 'dial'
  | 'pass'
  | 'quill'
  | 'turn'
  | 'sash'
  | 'agenda'
  | 'rung'
  | 'blaze'
  | 'folio';

export function SalonStage({
  tone,
  kicker,
  title,
  lead,
  aside,
  tools,
  wide = false,
  compact = false,
  held = false,
  children,
}: {
  tone: SalonTone;
  kicker: string;
  title: string;
  lead: string;
  aside?: ReactNode;
  tools?: ReactNode;
  wide?: boolean;
  compact?: boolean;
  /** Keep original home rhythm; luxury spacing is for every other hall. */
  held?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.stage} ${styles[tone] || ''} ${wide ? styles.wide : ''} ${compact ? styles.compact : ''} ${held ? styles.held : ''}`}>
      <div className={styles.filament} aria-hidden />
      <span className={styles.aura} aria-hidden />
      <span className={styles.grain} aria-hidden />
      <div className={styles.inner}>
        {compact ? (
          <HeroEnter>
            <div className={styles.ribbon}>
              <div className={styles.ribbonMark}>
                <span className={styles.seal}>
                  <BrandMark size={32} priority />
                </span>
                <div>
                  <span className={styles.kicker}>{kicker}</span>
                  <h1 className={styles.ribbonTitle}>{title}</h1>
                </div>
              </div>
              {aside ? <div className={styles.ribbonAside}>{aside}</div> : null}
            </div>
          </HeroEnter>
        ) : (
          <HeroEnter>
            <header className={styles.hero}>
              <div className={styles.heroMark}>
                <span className={styles.seal}>
                  <BrandMark size={40} priority />
                </span>
                <span className={styles.kicker}>{kicker}</span>
              </div>
              <div className={styles.heroCopy}>
                <h1>{title}</h1>
                <p>{lead}</p>
              </div>
              {aside ? <div className={styles.aside}>{aside}</div> : null}
            </header>
          </HeroEnter>
        )}
        {tools ? <div className={styles.tools}>{tools}</div> : null}
        <Reveal className={styles.body}>{children}</Reveal>
      </div>
    </div>
  );
}
