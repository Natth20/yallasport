import React, { forwardRef, type HTMLAttributes } from 'react';
import styles from './skeleton.module.css';

export type SkeletonVariant =
  | 'text'
  | 'avatar'
  | 'card'
  | 'table-row'
  | 'match-card'
  | 'news-card';

export type SkeletonAnimation = 'pulse' | 'shimmer' | 'none';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  animation?: SkeletonAnimation;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  count?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      animation = 'shimmer',
      width,
      height,
      borderRadius,
      count = 1,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const customStyle: React.CSSProperties = {
      ...style,
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(borderRadius !== undefined ? { borderRadius } : {}),
    };

    const classNames = [
      styles.skeleton,
      styles[variant],
      styles[animation],
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    if (variant === 'match-card') {
      return (
        <div ref={ref} className={`${styles.matchCardSkeleton} ${styles[animation]} ${className || ''}`} style={style} {...props}>
          <div className={styles.matchCardHeader}>
            <div className={styles.matchCardLeague} />
            <div className={styles.matchCardTime} />
          </div>
          <div className={styles.matchCardBody}>
            <div className={styles.teamCol}>
              <div className={styles.teamLogo} />
              <div className={styles.teamName} />
            </div>
            <div className={styles.scoreBox} />
            <div className={styles.teamCol}>
              <div className={styles.teamLogo} />
              <div className={styles.teamName} />
            </div>
          </div>
        </div>
      );
    }

    if (variant === 'news-card') {
      return (
        <div ref={ref} className={`${styles.newsCardSkeleton} ${styles[animation]} ${className || ''}`} style={style} {...props}>
          <div className={styles.newsCardThumb} />
          <div className={styles.newsCardContent}>
            <div className={styles.newsCardCategory} />
            <div className={styles.newsCardTitle1} />
            <div className={styles.newsCardTitle2} />
            <div className={styles.newsCardMeta} />
          </div>
        </div>
      );
    }

    if (variant === 'table-row') {
      return (
        <div ref={ref} className={`${styles.tableRowSkeleton} ${styles[animation]} ${className || ''}`} style={style} {...props}>
          <div className={styles.cellRank} />
          <div className={styles.cellTeam}>
            <div className={styles.cellLogo} />
            <div className={styles.cellName} />
          </div>
          <div className={styles.cellStat} />
          <div className={styles.cellStat} />
          <div className={styles.cellStat} />
          <div className={styles.cellPts} />
        </div>
      );
    }

    if (count > 1) {
      return (
        <div className={styles.multiContainer}>
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className={classNames}
              style={customStyle}
              aria-hidden="true"
              {...props}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={classNames}
        style={customStyle}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
