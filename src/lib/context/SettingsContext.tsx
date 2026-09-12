'use client';

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
  } catch {
    return false;
  }
}

function syncDataSaverDom(enabled: boolean) {
  document.documentElement.dataset.dataSaver = enabled ? 'on' : 'off';
  document.cookie = `yalla-data-saver=${enabled ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`;
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
