/* eslint-disable @next/next/no-img-element -- the loading shell must paint without an image-optimizer request */
import { LOGO_PATH, SITE_NAME, SITE_NAME_AR } from '@/lib/seo/site';
import styles from './brand-build.module.css';

export function BrandBuildScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${styles.ysBuild}${compact ? ` ${styles.isCompact}` : ''}`}
      role="status"
      aria-busy="true"
      aria-label={SITE_NAME_AR}
    >
      <div className={styles.ysBuildStage}>
        <div className={styles.ysBuildOrbit}>
          <span className={styles.ysBuildRing} aria-hidden />
          <span className={styles.ysBuildRing2} aria-hidden />
          <span className={styles.ysBuildHalo} aria-hidden />
          <span className={styles.ysBuildMark}>
            <img src={LOGO_PATH} alt="" width={220} height={220} className={styles.ysBuildLogo} />
          </span>
        </div>
        <div className={styles.ysBuildWord}>
          <strong>{SITE_NAME_AR}</strong>
          <span>{SITE_NAME}</span>
        </div>
        <div className={styles.ysBuildBar} aria-hidden>
          <i />
        </div>
      </div>
    </div>
  );
}
