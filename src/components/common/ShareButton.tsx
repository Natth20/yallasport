'use client';

import React, { useEffect, useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

/**
 * ShareButton - Uses Web Share API or falls back to Clipboard Copy.
 */
export const ShareButton: React.FC<ShareButtonProps> = ({ title, text, url }) => {
  const t = useTranslations('sports');
  const [copied, setCopied] = useState(false);
  const [supportsShare, setSupportsShare] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  useEffect(() => {
    setSupportsShare(typeof navigator.share === 'function');
  }, []);

  const handleShare = async () => {
    if (supportsShare) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-3 backdrop-blur-md border border-white/10"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : (supportsShare ? <Share2 className="w-4 h-4 text-orange-400" /> : <Copy className="w-4 h-4 text-orange-400" />)}
      {copied ? t('copied') : t('share')}
    </button>
  );
};
