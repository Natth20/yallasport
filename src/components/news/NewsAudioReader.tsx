'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLocale } from 'next-intl';
import { pick } from '@/i18n/pick';

/**
 * Client-only speech reader. Always mounts a stable button shell so React
 * never swaps null ↔ DOM nodes next to sibling controls (avoids insertBefore errors).
 */
export function NewsAudioReader({ text }: { text: string }) {
  const locale = useLocale();
  const [supported, setSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // ignore
      }
    };
  }, []);

  const togglePlay = () => {
    if (!supported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
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
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <button
      type="button"
      onClick={togglePlay}
      disabled={!supported}
      className={`news-audio-btn ${isPlaying ? 'is-playing' : ''}`}
      aria-pressed={isPlaying}
    >
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden>
        {isPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </span>
      <span>
        {isPlaying
          ? pick(locale, 'إيقاف الاستماع', 'Stop listening')
          : pick(locale, 'استمع', 'Listen')}
      </span>
    </button>
  );
}

export default NewsAudioReader;
