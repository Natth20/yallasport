'use client';

import { useSettings } from '@/lib/context/SettingsContext';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function skipMotion(reduce: boolean | null, dataSaver: boolean) {
  return reduce === true || dataSaver;
}

function useMotionLive() {
  const reduce = useReducedMotion();
  const { dataSaver } = useSettings();
  const [live, setLive] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (skipMotion(reduce, dataSaver)) return false;
  return live;
}

export function PageShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return <div className={`ys-page-shell${ready ? ' ys-motion-ready' : ''}`}>{children}</div>;
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 28,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  id?: string;
}) {
  const live = useMotionLive();
  if (!live) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.72, delay, ease }}
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
  const live = useMotionLive();
  if (!live) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8% 0px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const live = useMotionLive();
  if (!live) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.58, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroEnter({ children, className = '' }: { children: ReactNode; className?: string }) {
  const live = useMotionLive();
  if (!live) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.85, ease }}
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
