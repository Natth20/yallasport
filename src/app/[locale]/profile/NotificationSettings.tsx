'use client';

import React, { useState } from 'react';
import { Bell, Goal, PlayCircle, StopCircle, Zap } from 'lucide-react';
import {useLocale} from 'next-intl';
import {pick} from '@/i18n/pick';

interface NotificationSettingsProps {
  initialPrefs: {
    goal: boolean;
    matchStart: boolean;
    matchEnd: boolean;
    breakingNews: boolean;
  };
}

/**
 * NotificationSettings - UI for users to toggle specific push notification types.
 */
export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ initialPrefs }) => {
  const locale = useLocale();
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saving, setSaving] = useState(false);

  const toggle = async (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    
    try {
      // API call to update preferences
      await fetch('/api/user/notifications/prefs', {
        method: 'POST',
        body: JSON.stringify(newPrefs),
      });
    } catch (e) {
      console.error('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const options = [
    { key: 'goal', label: pick(locale, 'الأهداف', 'Goals'), icon: Goal, color: 'text-green-500' },
    { key: 'matchStart', label: pick(locale, 'بداية المباريات', 'Match starts'), icon: PlayCircle, color: 'text-blue-500' },
    { key: 'matchEnd', label: pick(locale, 'نهاية المباريات', 'Match ends'), icon: StopCircle, color: 'text-red-500' },
    { key: 'breakingNews', label: pick(locale, 'الأخبار العاجلة', 'Breaking news'), icon: Zap, color: 'text-orange-500' },
  ] as const;

  return (
    <div className="space-y-4">
      {options.map((opt) => (
        <div 
          key={opt.key}
          className="flex items-center justify-between p-6 bg-muted dark:bg-muted/50 rounded-3xl border border-transparent hover:border-orange-500/20 transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl bg-card dark:bg-muted shadow-sm ${opt.color}`}>
              <opt.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black block">{opt.label}</span>
              <span className="text-xs font-bold text-muted-foreground">{pick(locale, 'تلقَّ إشعاراً فورياً عند حدوث', 'Receive an instant alert for')} {opt.label}</span>
            </div>
          </div>
          
          <button
            onClick={() => toggle(opt.key)}
            disabled={saving}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
              prefs[opt.key] ? 'bg-orange-500' : 'bg-gray-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-card transition-transform duration-300 shadow-lg ${
                prefs[opt.key] ? '-translate-x-7' : '-translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
      
      {saving && (
        <p className="text-center text-[10px] font-black text-orange-500 animate-pulse tracking-widest uppercase mt-4">
          {pick(locale, 'جاري حفظ التفضيلات...', 'Saving preferences...')}
        </p>
      )}
    </div>
  );
};
