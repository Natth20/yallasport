'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from 'react';
import { Link } from '@/i18n/navigation';
import styles from './dropdown.module.css';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);
  if (!ctx) {
    throw new Error('Dropdown compound components must be used within a Dropdown component');
  }
  return ctx;
}

export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggle = () => setIsOpen((prev) => !prev);
    const close = () => setIsOpen(false);

    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          close();
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          close();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    return (
      <DropdownContext.Provider value={{ isOpen, setIsOpen, toggle, close }}>
        <div
          ref={(node) => {
            containerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={`${styles.dropdownRoot} ${className || ''}`}
          {...props}
        >
          {children}
        </div>
      </DropdownContext.Provider>
    );
  }
);
Dropdown.displayName = 'Dropdown';

export interface DropdownTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  asChild?: boolean;
}

export const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { isOpen, toggle } = useDropdownContext();

    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={(e) => {
          onClick?.(e);
          toggle();
        }}
        className={`${styles.trigger} ${className || ''}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownTrigger.displayName = 'DropdownTrigger';

export interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  placement?: DropdownPlacement;
  children: ReactNode;
}

export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ placement = 'bottom-start', className, children, ...props }, ref) => {
    const { isOpen } = useDropdownContext();
    if (!isOpen) return null;

    const menuClasses = [
      styles.menu,
      styles[placement],
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} role="menu" className={menuClasses} {...props}>
        {children}
      </div>
    );
  }
);
DropdownMenu.displayName = 'DropdownMenu';

export interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  destructive?: boolean;
  children: ReactNode;
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ icon, destructive = false, className, children, disabled, onClick, ...props }, ref) => {
    const { close } = useDropdownContext();

    const itemClasses = [
      styles.item,
      destructive ? styles.destructive : '',
      disabled ? styles.disabled : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={(e) => {
          if (disabled) return;
          onClick?.(e);
          close();
        }}
        className={itemClasses}
        {...props}
      >
        {icon && <span className={styles.itemIcon}>{icon}</span>}
        <span className={styles.itemLabel}>{children}</span>
      </button>
    );
  }
);
DropdownItem.displayName = 'DropdownItem';

export interface DropdownLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export const DropdownLink = ({ href, children, className }: DropdownLinkProps) => {
  const { close } = useDropdownContext();
  return (
    <Link href={href} role="menuitem" className={`${styles.item} ${className || ''}`} onClick={() => close()}>
      {children}
    </Link>
  );
};

export interface DropdownGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  children: ReactNode;
}

export const DropdownGroup = forwardRef<HTMLDivElement, DropdownGroupProps>(
  ({ label, className, children, ...props }, ref) => (
    <div ref={ref} className={`${styles.group} ${className || ''}`} {...props}>
      {label && <div className={styles.groupLabel}>{label}</div>}
      {children}
    </div>
  )
);
DropdownGroup.displayName = 'DropdownGroup';

export const DropdownDivider = () => <div className={styles.divider} role="separator" />;
