import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { HeroEnter, Reveal } from '@/components/motion/PageMotion';

export type SalonTone = 'vault' | 'gallery' | 'podium' | 'wire' | 'booth' | 'seek';

export function SalonStage({
  tone,
  kicker,
  title,
  lead,
  aside,
  tools,
  wide = false,
  children,
}: {
  tone: SalonTone;
  kicker: string;
  title: string;
  lead: string;
  aside?: ReactNode;
  tools?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`salon-stage salon-${tone}${wide ? ' is-wide' : ''}`}>
      <span className="salon-aura" aria-hidden />
      <span className="salon-grain" aria-hidden />
      <div className="salon-inner">
        <HeroEnter>
          <header className="salon-hero">
            <div className="salon-hero-mark">
              <BrandMark size={56} priority />
              <span className="salon-kicker">{kicker}</span>
            </div>
            <div className="salon-hero-copy">
              <h1>{title}</h1>
              <p>{lead}</p>
            </div>
            {aside ? <div className="salon-hero-aside">{aside}</div> : null}
          </header>
        </HeroEnter>
        {tools ? <div className="salon-tools">{tools}</div> : null}
        <Reveal className="salon-body">{children}</Reveal>
      </div>
    </div>
  );
}
