import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './badge.module.css';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning'
  | 'outline'
  | 'live';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      pulse = false,
      icon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isLive = variant === 'live';
    const showPulse = pulse || isLive;
    const showDot = dot || isLive;

    const classNames = [
      styles.badge,
      styles[variant],
      styles[size],
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classNames} {...props}>
        {showDot && (
          <span className={styles.dotWrapper}>
            <span className={`${styles.dot} ${showPulse ? styles.pulsingDot : ''}`} />
            {showPulse && <span className={styles.pingDot} />}
          </span>
        )}
        {icon && <span className={styles.icon}>{icon}</span>}
        {children && <span className={styles.label}>{children}</span>}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
