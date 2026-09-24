import { displayChannelName } from './channels';

export function toYoutubeCards(
  clips: Array<{
    youtubeId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    thumbnailUrl: string | null;
    publishedAt: Date;
    description: string | null;
    lang: string;
    durationSec: number | null;
  }>,
  locale: string,
) {
  return clips.map((clip) => ({
    youtubeId: clip.youtubeId,
    title: clip.title,
    channelId: clip.channelId,
    channelTitle: displayChannelName(clip.channelId, clip.channelTitle, locale),
    thumbnailUrl: clip.thumbnailUrl,
    publishedAt: clip.publishedAt.toISOString(),
    description: clip.description,
    lang: clip.lang,
    durationSec: clip.durationSec,
  }));
}

export function youtubeCopy(locale: string) {
  const ar = locale !== 'en';
  return {
    source: ar ? 'المصدر' : 'Source',
    youtube: ar ? 'يوتيوب' : 'YouTube',
    notLive: ar ? 'ليس يلا سبورت مباشر' : 'Not Yalla Sport Live',
    arabic: ar ? 'عربي' : 'Arabic',
    english: ar ? 'إنجليزي' : 'English',
    published: ar ? 'نُشر' : 'Published',
    channel: ar ? 'القناة' : 'Channel',
    duration: ar ? 'المدة' : 'Duration',
    play: ar ? 'تشغيل' : 'Play',
    watchOnYoutube: ar ? 'افتح على يوتيوب' : 'Watch on YouTube',
    embedBlocked: ar
      ? 'القناة منعت عرض هذا المقطع داخل الموقع. افتحه على يوتيوب.'
      : 'The channel blocked this clip from playing on other sites. Open it on YouTube.',
    nowShowing: ar ? 'الآن على الشاشة' : 'Now showing',
    nowPlaying: ar ? 'يُعرض' : 'Playing',
    shelf: ar ? 'الرفّ' : 'The shelf',
    shelfLead: ar ? 'اختر كليباً ليُعرض في القاعة' : 'Pick a clip to put it on screen',
  };
}
