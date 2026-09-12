'use client';

import { animate, inView, motion, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, type ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

const MOTION_SELECTOR = [
  '.atlas-hero',
  '.atlas-wire',
  '.about-maison-hero',
  '.about-maison-band',
  '.about-maison-panel',
  '.search-stage-hero-inner',
  '.search-block-panel',
  '.contact-hero',
  '.contact-blotter',
  '.contact-side-plate',
  '.contact-wings',
  '.contact-doors',
  '.watch-marquee',
  '.watch-signature',
  '.watch-gate',
  '.watch-section-mark',
  '.watch-ticket',
  '.watch-live-chip',
  '.league-hero',
  '.league-plate',
  '.league-dossier section',
  '.news-report-hero',
  '.news-report-body',
  '.news-desk-hero',
  '.floodlight-hero',
  '.matchday-spotlight',
  '.matchday-dock',
  '.matchday-plate',
  '.matchday-soon',
  '.fixture-board',
  '.match-dossier',
  '.match-plate',
  '.club-dossier',
  '.club-hero',
  '.player-dossier',
  '.player-hero',
  '.versus-night',
  '.board-night',
  '.post-night',
  '.tv-guide-hero',
  '.predictions-stage',
  '.league-salon-hero',
  '.home-brand-band',
  '.home-section-mark',
  '.home-doors',
  '.home-board-teaser',
  '.league-salon-page > main > section',
  'main > section',
].join(', ');

function AutoPageMotion() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;

    const root = document.querySelector('.ys-page-shell');
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>(MOTION_SELECTOR)).filter((el) => {
      if (el.dataset.ysMotionManual === '1') return false;
      if (el.closest('[data-ys-motion-manual="1"]')) return false;
      return true;
    });

    if (nodes.length === 0) return;

    const cleanups = nodes.map((el, index) => {
      const kind = index === 0 || el.matches('.atlas-hero, .about-maison-hero, .search-stage-hero-inner, .contact-hero, .watch-marquee, .league-hero, .news-report-hero, .floodlight-hero, .league-salon-hero, .matchday-spotlight, .match-dossier, .club-hero, .player-hero')
        ? 'hero'
        : 'block';
      el.dataset.ysMotion = kind;
      el.style.opacity = '0.01';
      // use transform via motion values through animate's y when possible; set initial y via style
      el.style.transform = kind === 'hero' ? 'translateY(12px)' : 'translateY(20px)';

      return inView(
        el,
        () => {
          animate(
            el,
            { opacity: 1, transform: 'translateY(0px)' },
            { duration: kind === 'hero' ? 0.65 : 0.55, ease: [0.22, 1, 0.36, 1], delay: kind === 'hero' ? 0.02 : 0.04 }
          );
        },
        { amount: 0.12, margin: '0px 0px -5% 0px' }
      );
    });

    return () => {
      cleanups.forEach((stop) => stop());
    };
  }, [reduce]);

  return null;
}

export function PageShell({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="ys-page-shell"
      initial={reduce ? false : { opacity: 0.01 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease }}
    >
      {children}
      <AutoPageMotion />
    </motion.div>
  );
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 22,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  id?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      id={id}
      className={className}
      data-ys-motion-manual="1"
      initial={reduce ? false : { opacity: 0.01, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.07,
        delayChildren: reduce ? 0 : delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      data-ys-motion-manual="1"
      variants={container}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const item: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0.01, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.48, ease },
    },
  };

  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

export function HeroEnter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      data-ys-motion-manual="1"
      initial={reduce ? false : { opacity: 0.01, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease }}
    >
      {children}
    </motion.div>
  );
}

/** @deprecated use Reveal */
export const AboutReveal = Reveal;
/** @deprecated use Stagger */
export const AboutStagger = Stagger;
/** @deprecated use StaggerItem */
export const AboutItem = StaggerItem;
/** @deprecated use HeroEnter */
export const AboutHeroMotion = HeroEnter;
