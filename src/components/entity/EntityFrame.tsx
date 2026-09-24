'use client';

import { Children, type ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { HeroEnter, Stagger, StaggerItem } from '@/components/motion/PageMotion';
import './entity.css';

export type EntityTone = 'player' | 'club' | 'nation' | 'coach' | 'match';

export function EntityFrame({
  tone,
  children,
}: {
  tone: EntityTone;
  children: ReactNode;
}) {
  return (
    <div className={`entity-frame entity-${tone}`}>
      <span className="entity-aura" aria-hidden />
      <span className="entity-grain" aria-hidden />
      <div className="entity-inner">{children}</div>
    </div>
  );
}

export function EntityBrand({ kicker }: { kicker: string }) {
  return (
    <div className="entity-brand">
      <BrandMark size={36} priority />
      <span>{kicker}</span>
    </div>
  );
}

export function EntityHero({ children }: { children: ReactNode }) {
  return <HeroEnter>{children}</HeroEnter>;
}

export function EntityBody({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter((child) => typeof child !== 'string');
  return (
    <Stagger className="entity-body" delay={0.04}>
      {items.map((child, index) => (
        <StaggerItem key={index}>{child}</StaggerItem>
      ))}
    </Stagger>
  );
}
