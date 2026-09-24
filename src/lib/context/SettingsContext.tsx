'use client';
import { reportCaughtError } from '@/lib/ops/caught';


import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
  dataSaver: boolean;
  toggleDataSaver: () => void;
  timezone: string;
  timezoneMode: 'auto' | 'manual';
  setTimezone: (timezone: string | 'auto') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
const DATA_SAVER_KEY = 'yalla-data-saver';
const DEFAULT_SETTINGS: SettingsContextType = {
  dataSaver: false,
  toggleDataSaver: () => undefined,
  timezone: 'Asia/Riyadh',
  timezoneMode: 'auto',
  setTimezone: () => undefined,
};

function readDataSaver(): boolean {
  try {
    return JSON.parse(localStorage.getItem(DATA_SAVER_KEY) || 'false') === true;
  } catch (error) {
    reportCaughtError("src/lib/context/SettingsContext.tsx:26", error, { persist: false });
    return false;
  }
}

function syncDataSaverDom(enabled: boolean) {
  document.documentElement.dataset.dataSaver = enabled ? 'on' : 'off';
  document.cookie = `yalla-data-saver=${enabled ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`;
}

function syncReducedMotionDom() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.dataset.reducedMotion = reduce ? 'on' : 'off';
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataSaver, setDataSaver] = useState(false);
  const [timezone, setTimezoneState] = useState('Asia/Riyadh');
  const [timezoneMode, setTimezoneMode] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    const saved = readDataSaver();
    setDataSaver(saved);
    syncDataSaverDom(saved);

    const savedTimezone = localStorage.getItem('yalla-timezone');
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh';
    const nextTimezone = savedTimezone && savedTimezone !== 'auto' ? savedTimezone : detectedTimezone;
    setTimezoneState(nextTimezone);
    setTimezoneMode(savedTimezone && savedTimezone !== 'auto' ? 'manual' : 'auto');
    document.cookie = `yalla-tz=${encodeURIComponent(nextTimezone)}; path=/; max-age=31536000; samesite=lax`;
    syncReducedMotionDom();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => syncReducedMotionDom();
    motion.addEventListener('change', onMotion);
    return () => motion.removeEventListener('change', onMotion);
  }, []);

  useEffect(() => {
    syncDataSaverDom(dataSaver);
  }, [dataSaver]);

  const toggleDataSaver = useCallback(() => {
    setDataSaver((current) => {
      const next = !current;
      localStorage.setItem(DATA_SAVER_KEY, JSON.stringify(next));
      syncDataSaverDom(next);
      return next;
    });
  }, []);

  const setTimezone = useCallback((value: string | 'auto') => {
    const nextTimezone =
      value === 'auto'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh'
        : value;
    setTimezoneState(nextTimezone);
    setTimezoneMode(value === 'auto' ? 'auto' : 'manual');
    localStorage.setItem('yalla-timezone', value);
    document.cookie = `yalla-tz=${encodeURIComponent(nextTimezone)}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <SettingsContext.Provider value={{ dataSaver, toggleDataSaver, timezone, timezoneMode, setTimezone }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  return context ?? DEFAULT_SETTINGS;
};

export const useSettingsOptional = () => useContext(SettingsContext);
