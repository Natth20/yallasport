import { SITE_NAME, SITE_NAME_AR } from '@/lib/seo/site';
import { MetalMark } from './MetalMark';
import styles from './brand-build.module.css';

export function BrandBuildScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${styles.stage}${compact ? ` ${styles.compact}` : ''}`}
      role="status"
      aria-busy="true"
      aria-label={SITE_NAME_AR}
    >
      <div className={styles.center}>
        <MetalMark size={compact ? 'md' : 'lg'} priority />
        <div className={styles.word}>
          <strong>
            <span className={styles.accent}>يلا</span> سبورت
          </strong>
          <em>{SITE_NAME}</em>
        </div>
      </div>
    </div>
  );
}
