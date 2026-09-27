import React, { forwardRef, type HTMLAttributes, type ReactNode, type ElementType } from 'react';
import styles from './card.module.css';

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass' | 'interactive' | 'accent' | 'premium';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => {
    const classNames = [
      styles.card,
      styles[variant],
      styles[`p-${padding}`],
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`${styles.header} ${className || ''}`} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: ElementType;
  children?: ReactNode;
}
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Component = 'h3', className, children, ...props }, ref) => (
    <Component ref={ref} className={`${styles.title} ${className || ''}`} {...props}>
      {children}
    </Component>
  )
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={`${styles.description} ${className || ''}`} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`${styles.content} ${className || ''}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`${styles.footer} ${className || ''}`} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
