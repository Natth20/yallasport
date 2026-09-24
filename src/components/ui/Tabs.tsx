'use client';

import React, {
  createContext,
  useContext,
  useState,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from 'react';
import styles from './tabs.module.css';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (val: string) => void;
  variant: 'default' | 'pills' | 'underline';
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs compound components must be used within a Tabs component');
  }
  return ctx;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      defaultValue,
      value,
      onValueChange,
      variant = 'default',
      orientation = 'horizontal',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const activeTab = value !== undefined ? value : internalValue;

    const handleTabChange = (val: string) => {
      if (value === undefined) {
        setInternalValue(val);
      }
      onValueChange?.(val);
    };

    const containerClasses = [
      styles.tabsRoot,
      styles[orientation],
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <TabsContext.Provider
        value={{
          activeTab,
          setActiveTab: handleTabChange,
          variant,
          orientation,
        }}
      >
        <div ref={ref} className={containerClasses} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const { variant, orientation } = useTabsContext();

    const listClasses = [
      styles.tabsList,
      styles[`list-${variant}`],
      styles[`list-${orientation}`],
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} role="tablist" className={listClasses} {...props}>
        {children}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: ReactNode;
  children: ReactNode;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, icon, className, children, disabled, ...props }, ref) => {
    const { activeTab, setActiveTab, variant } = useTabsContext();
    const isActive = activeTab === value;

    const triggerClasses = [
      styles.trigger,
      styles[`trigger-${variant}`],
      isActive ? styles.active : '',
      disabled ? styles.disabled : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        disabled={disabled}
        onClick={() => !disabled && setActiveTab(value)}
        className={triggerClasses}
        {...props}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{children}</span>
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab } = useTabsContext();
    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={`${styles.tabContent} ${className || ''}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';
