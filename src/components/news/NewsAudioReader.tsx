'use client';

import { reportCaughtError } from '@/lib/ops/caught';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { pick } from '@/i18n/pick';

/**
 * Modern speech reader for news articles with live animation feedback.
 */
export function NewsAudioReader({ text }: { text: string }) {
  const locale = useLocale();
  const [supported, setSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch (error) {
        reportCaughtError('src/components/news/NewsAudioReader.tsx:27', error, { persist: false });
      }
    };
  }, []);

  const togglePlay = () => {
    if (!supported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    const cleanText = textRef.current
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = locale === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 1;
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={togglePlay}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
        isPlaying
          ? 'border border-primary/40 bg-primary/15 text-primary shadow-sm shadow-primary/10'
          : 'border border-border/80 bg-card/80 text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-primary'
      }`}
      aria-pressed={isPlaying}
      title={isPlaying ? pick(locale, 'إيقاف الاستماع', 'Stop listening') : pick(locale, 'استمع للتقرير', 'Listen to story')}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        {isPlaying ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
            <VolumeX className="relative h-4 w-4 text-primary" />
          </>
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </span>
      <span>
        {isPlaying
          ? pick(locale, 'إيقاف الاستماع', 'Stop listening')
          : pick(locale, 'استمع للتقرير', 'Listen')}
      </span>
    </button>
  );
}

export default NewsAudioReader;
