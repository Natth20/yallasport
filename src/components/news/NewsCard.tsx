// src/components/news/NewsCard.tsx
import React from 'react';
import {Link} from '@/i18n/navigation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ArrowLeft, Clock } from 'lucide-react';

interface NewsCardProps {
  news: {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    featuredImage?: string;
    category: string;
    publishedAt: Date;
    isPremium?: boolean;
  };
  variant?: 'horizontal' | 'vertical' | 'hero' | 'slim';
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, variant = 'vertical' }) => {
  const isPremium = news.isPremium;

  if (variant === 'hero') {
    return (
      <Link href={`/news/${news.slug}`} className="relative block w-full aspect-[21/9] rounded-2xl overflow-hidden group shadow-lux transition-all duration-700 border border-border dark:border-border">
        <img 
          src={news.featuredImage || '/placeholder-news.svg'} 
          alt={news.title} 
          className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-orange-500 text-primary-foreground text-[9px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">
              {news.category}
            </span>
            <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-medium">
               <Clock className="w-3 h-3" />
               <span>{format(new Date(news.publishedAt), 'HH:mm')}</span>
            </div>
          </div>
          <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight max-w-3xl group-hover:text-orange-500 transition-colors duration-500 tracking-tight mb-3">
            {news.title}
          </h2>
          <p className="hidden md:block text-white/60 font-medium text-sm max-w-xl line-clamp-2 leading-relaxed">
            {news.excerpt}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'slim') {
    return (
      <Link href={`/news/${news.slug}`} className="flex items-center gap-4 group p-2 rounded-lg hover:bg-muted dark:hover:bg-muted transition-all">
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border dark:border-border">
           <img src={news.featuredImage || '/placeholder-news.svg'} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
        </div>
        <div className="space-y-1 flex-1">
           <span className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">{news.category}</span>
           <h4 className="text-[13px] font-semibold text-foreground dark:text-foreground line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">{news.title}</h4>
           <span className="text-[9px] text-muted-foreground font-medium">{format(new Date(news.publishedAt), 'dd MMM')}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/news/${news.slug}`} className="flex flex-col group space-y-4 transition-all">
      <div className="w-full aspect-[16/10] rounded-xl overflow-hidden relative border border-border dark:border-border">
        <img 
          src={news.featuredImage || '/placeholder-news.svg'} 
          alt={news.title} 
          className="w-full h-full object-cover transition-all duration-[1000ms] group-hover:scale-105" 
        />
        <div className="absolute top-3 right-3">
           <span className="bg-card/90 dark:bg-background/90 backdrop-blur-md text-foreground dark:text-foreground text-[8px] font-bold px-3 py-1 rounded-md uppercase tracking-wider border border-border dark:border-border">
              {news.category}
           </span>
        </div>
      </div>
      <div className="px-1 space-y-2">
        <h3 className="text-lg font-bold leading-tight text-foreground dark:text-foreground group-hover:text-orange-500 transition-colors line-clamp-2 tracking-tight">
          {news.title}
        </h3>
        <div className="flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
           <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              {format(new Date(news.publishedAt), 'dd MMM yyyy', { locale: ar })}
           </span>
           <ArrowLeft className="w-3.5 h-3.5 text-orange-500 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
