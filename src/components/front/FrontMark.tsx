import { BrandBuildScreen } from '@/components/brand/BrandBuildScreen';
import { Link } from '@/i18n/navigation';
import styles from './front-mark.module.css';
import page from './front-page.module.css';

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
  return (
    <header className={styles.mark}>
      <div className={styles.titles}>
        <em>{num}</em>
        <h2>{title}</h2>
      </div>
      {note ? <p>{note}</p> : null}
      {href && cta ? (
        <Link href={href as '/'} className={styles.cta}>
          {cta}
        </Link>
      ) : null}
    </header>
  );
}

export function FrontSkeleton({ kind }: { kind: 'hero' | 'pulse' | 'chapter' }) {
  if (kind === 'hero') return <BrandBuildScreen />;
  if (kind === 'pulse') return <div className={page.skelPulse} aria-hidden />;
  return <div className={page.skelChapter} aria-hidden />;
}
