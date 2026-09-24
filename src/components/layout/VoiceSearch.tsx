'use client';
import { reportCaughtError } from '@/lib/ops/caught';


import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onresult: ((event: {
    results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }>;
  }) => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

interface VoiceSearchProps {
  onResult: (text: string) => void;
  className?: string;
}

/**
 * VoiceSearch - Client-side component for Arabic/English voice input.
 */
export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onResult, className = '' }) => {
  const t = useTranslations('sports');
  const locale = useLocale();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const startListening = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setSupported(false);
      window.alert(t('voice_unsupported'));
      return;
    }

    // Secure contexts only (https / localhost). Plain http on LAN often fails silently.
    if (typeof window.isSecureContext === 'boolean' && !window.isSecureContext) {
      window.alert(t('voice_insecure'));
      return;
    }

    try {
      recognitionRef.current?.abort();
      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.lang = locale.startsWith('ar') ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) onResultRef.current(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        recognitionRef.current = null;
        const error = event.error;
        if (error === 'not-allowed' || error === 'service-not-allowed') {
          window.alert(t('voice_permission'));
        } else if (error === 'audio-capture') {
          window.alert(t('voice_no_mic'));
        } else if (error && error !== 'aborted' && error !== 'no-speech') {
          window.alert(t('voice_failed'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (error) {
      reportCaughtError("src/components/layout/VoiceSearch.tsx:117", error, { persist: false });
      setIsListening(false);
      recognitionRef.current = null;
      window.alert(t('voice_failed'));
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!supported && !isListening}
      className={`rounded-full p-2 transition-all ${
        isListening
          ? 'animate-pulse bg-red-500 text-white'
          : 'text-muted-foreground hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-slate-800'
      } ${className}`}
      title={isListening ? t('stop_listening') : t('voice_search')}
      aria-label={isListening ? t('stop_listening') : t('voice_search')}
      aria-pressed={isListening}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
};
