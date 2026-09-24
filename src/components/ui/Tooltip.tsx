'use client';

import React, {
  useState,
  useRef,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import styles from './tooltip.module.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  showArrow?: boolean;
  children: ReactNode;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      position = 'top',
      delay = 150,
      showArrow = true,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    };

    const tooltipClasses = [
      styles.tooltipBubble,
      styles[position],
      isVisible ? styles.visible : '',
      showArrow ? styles.withArrow : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={`${styles.tooltipContainer} ${className || ''}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        {...props}
      >
        {children}
        {isVisible && (
          <div role="tooltip" className={tooltipClasses}>
            {content}
            {showArrow && <span className={styles.arrow} />}
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';
