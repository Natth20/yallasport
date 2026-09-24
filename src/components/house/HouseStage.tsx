import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { HeroEnter } from '@/components/motion/PageMotion';
import styles from './house.module.css';

export function HouseStage({
  kicker,
  title,
  lead,
  aside,
  children,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={styles.stage}>
      <span className={styles.stageAura} aria-hidden />
      <span className={styles.stageGrid} aria-hidden />
      <div className={styles.stageInner}>
        <HeroEnter>
          <header className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,20rem)] lg:items-end">
            <div>
              {kicker ? (
                <p className={styles.kicker}>
                  <BrandMark size={32} priority />
                  <span>{kicker}</span>
                </p>
              ) : null}
              <h1>{title}</h1>
              {lead ? <p className={styles.stageLead}>{lead}</p> : null}
            </div>
            {aside ? <div>{aside}</div> : null}
          </header>
        </HeroEnter>
        {children}
      </div>
    </section>
  );
}

