import React from 'react';
import { BrandBuildScreen } from '@/components/brand/BrandBuildScreen';
import { HouseMark } from '@/components/house/HouseMark';
import styles from './front-hall.module.css';

export function FrontMark({
  num,
  title,
  note,
  href,
  cta,
}: {
  num: string;
  title: string;
  note?: string;
  href?: string;
  cta?: string;
}) {
  return <HouseMark num={num} title={title} note={note} href={href} cta={cta} />;
}

export function FrontSkeleton({ kind }: { kind: 'hero' | 'pulse' | 'chapter' }) {
  if (kind === 'hero') return <BrandBuildScreen compact />;
  if (kind === 'pulse') return <div className={styles.skelPulse} aria-hidden />;
  return <div className={styles.skelChapter} aria-hidden />;
}
