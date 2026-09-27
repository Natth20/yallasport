import React, { forwardRef, type HTMLAttributes } from 'react';
import { MetalMark } from '@/components/brand/MetalMark';
import styles from './loader.module.css';

export type LoaderVariant = 'spinner' | 'dots' | 'football';
export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: LoaderVariant;
  size?: LoaderSize;
  label?: string;
  fullPage?: boolean;
}

export const Loader = forwardRef<HTMLDivElement, LoaderProps>(
  (
    {
      variant = 'spinner',
      size = 'md',
      label,
      fullPage = false,
      className,
      ...props
    },
    ref
  ) => {
    const containerClasses = [
      styles.loaderContainer,
      fullPage ? styles.fullPage : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    const loaderClasses = [
      styles.loader,
      styles[variant],
      styles[size],
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={containerClasses} role="status" aria-live="polite" {...props}>
        {variant === 'spinner' && (
          <div className={loaderClasses}>
            <svg
              className={styles.spinnerSvg}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className={styles.spinnerTrack}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={styles.spinnerThumb}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}

        {variant === 'dots' && (
          <div className={loaderClasses}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        )}

        {variant === 'football' && (
          <div className={loaderClasses}>
            <MetalMark size={size} />
          </div>
        )}

        {label && <p className={styles.label}>{label}</p>}
        <span className="sr-only">{label || 'جاري التحميل...'}</span>
      </div>
    );
  }
);

Loader.displayName = 'Loader';
