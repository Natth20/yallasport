'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles, Gauge } from 'lucide-react';

interface AudioArticleReaderProps {
  title: string;
  content: string;
  locale?: string;
}

export function AudioArticleReader({
  title,
  content,
  locale = 'ar',
}: AudioArticleReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isAr = locale === 'ar';

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Strip HTML / Markdown tags for clean reading
  const cleanText = (raw: string) => {
    return raw
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[#*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleTogglePlay = () => {
    if (!isSupported) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const fullNarrative = `${title}. ${cleanText(content)}`;
    const utterance = new SpeechSynthesisUtterance(fullNarrative);
    utteranceRef.current = utterance;

    utterance.lang = isAr ? 'ar-SA' : 'en-US';
    utterance.rate = rate;

    // Pick Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) => v.lang.startsWith(isAr ? 'ar' : 'en'));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const cycleRate = () => {
    const nextRate = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1;
    setRate(nextRate);
    if (isPlaying && utteranceRef.current) {
      handleStop();
      setTimeout(handleTogglePlay, 100);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="my-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/80 to-card/90 p-4 shadow-lg backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Volume2 className={`h-5 w-5 ${isPlaying && !isPaused ? 'animate-pulse' : ''}`} />
            {isPlaying && !isPaused && (
              <span className="absolute -inset-1 rounded-xl bg-primary/30 animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                {isAr ? 'القارئ الصوتي الذكي (AI Audio Reader)' : 'AI Audio Article Reader'}
              </h4>
            </div>
            <p className="text-[11px] font-semibold text-foreground/60">
              {isPlaying
                ? isPaused
                  ? isAr ? 'متوقف مؤقتاً' : 'Paused'
                  : isAr ? 'جاري القراءة بالصوت الطبيعي...' : 'Reading article audio...'
                : isAr ? 'استمع للخبر كاملاً دون الحاجة للقراءة' : 'Listen to full article'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              type="button"
              onClick={cycleRate}
              title={isAr ? 'تغيير سرعة القراءة' : 'Change playback speed'}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-card px-2.5 py-1.5 text-xs font-black text-foreground hover:bg-foreground/5"
            >
              <Gauge className="h-3.5 w-3.5 text-primary" />
              <span>{rate}x</span>
            </button>
          )}

          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              title={isAr ? 'إعادة التشغيل' : 'Reset'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-card text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="h-4 w-4" />
                <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>{isAr ? (isPaused ? 'استئناف' : 'استمع للخبر') : (isPaused ? 'Resume' : 'Listen Now')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sound waves animation bar when playing */}
      {isPlaying && !isPaused && (
        <div className="mt-3 flex items-center justify-center gap-1">
          {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75].map((h, idx) => (
            <span
              key={idx}
              style={{
                height: `${Math.max(6, Math.min(22, (h * Math.random()) + 6))}px`,
                animationDelay: `${idx * 0.1}s`,
              }}
              className="w-1 rounded-full bg-primary/80 transition-all duration-300"
            />
          ))}
        </div>
      )}
    </div>
  );
}
