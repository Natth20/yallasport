'use client';

import React, {
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type ElementType,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
  className?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  children,
  className,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalClasses = [
    styles.dialog,
    styles[size],
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div
        className={styles.backdrop}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div ref={modalRef} className={modalClasses}>
        {showCloseButton && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="إغلاق النافذة"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className={styles.closeIcon}>
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return null;
};

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`${styles.header} ${className || ''}`} {...props}>
      {children}
    </div>
  )
);
ModalHeader.displayName = 'ModalHeader';

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: ElementType;
  children?: ReactNode;
}
export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ as: Component = 'h3', className, children, ...props }, ref) => (
    <Component ref={ref} className={`${styles.title} ${className || ''}`} {...props}>
      {children}
    </Component>
  )
);
ModalTitle.displayName = 'ModalTitle';

export interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}
export const ModalDescription = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={`${styles.description} ${className || ''}`} {...props}>
      {children}
    </p>
  )
);
ModalDescription.displayName = 'ModalDescription';

export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`${styles.content} ${className || ''}`} {...props}>
      {children}
    </div>
  )
);
ModalContent.displayName = 'ModalContent';

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`${styles.footer} ${className || ''}`} {...props}>
      {children}
    </div>
  )
);
ModalFooter.displayName = 'ModalFooter';
