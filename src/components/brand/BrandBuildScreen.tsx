/* eslint-disable @next/next/no-img-element -- the loading shell must paint without an image-optimizer request */
import { LOGO_PATH, SITE_NAME, SITE_NAME_AR } from '@/lib/seo/site';
import './brand-build.css';

export function BrandBuildScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`ys-build${compact ? ' is-compact' : ''}`}
      role="status"
      aria-busy="true"
      aria-label={SITE_NAME_AR}
    >
      <div className="ys-build-stage">
        <div className="ys-build-orbit">
          <span className="ys-build-ring" aria-hidden />
          <span className="ys-build-ring-2" aria-hidden />
          <span className="ys-build-halo" aria-hidden />
          <span className="ys-build-mark">
            <img src={LOGO_PATH} alt="" width={220} height={220} className="ys-build-logo" />
          </span>
        </div>
        <div className="ys-build-word">
          <strong>{SITE_NAME_AR}</strong>
          <span>{SITE_NAME}</span>
        </div>
        <div className="ys-build-bar" aria-hidden>
          <i />
        </div>
      </div>
    </div>
  );
}
