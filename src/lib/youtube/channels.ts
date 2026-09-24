export type YoutubeChannelLang = 'ar' | 'en';

export type YoutubeChannel = {
  id: string;
  name: string;
  nameAr: string;
  lang: YoutubeChannelLang;
};

/** Official football YouTube channels. Not licensed match streams. */
export const FOOTBALL_YOUTUBE_CHANNELS: YoutubeChannel[] = [
  { id: 'UCJUCcJUeh0Cz2xyKwkw5Q1w', name: 'beIN SPORTS', nameAr: 'بي إن سبورتس', lang: 'ar' },
  { id: 'UCA86pBGxVPZGrTeTecOtjew', name: 'Al Ahly', nameAr: 'الأهلي', lang: 'ar' },
  { id: 'UChM_8YeNCava2-OSbgbpe_w', name: 'Al Hilal', nameAr: 'الهلال', lang: 'ar' },
  { id: 'UCHEQtltsiDd3p8ga-5nC-ow', name: 'Al Nassr', nameAr: 'النصر', lang: 'ar' },
  { id: 'UCjFoqlYTqHdGhlnpsqr8j7Q', name: 'CAF', nameAr: 'كاف', lang: 'ar' },
  { id: 'UCnj0TjaM0wyxkAWW_nz8_1g', name: 'The AFC Hub', nameAr: 'الاتحاد الآسيوي', lang: 'ar' },
  { id: 'UCXTRFt1vLvZpahQtiKJjLaQ', name: 'AFC Asian Cup', nameAr: 'كأس آسيا', lang: 'ar' },
  { id: 'UCpcTrCXblq78GZrTUTLWeBw', name: 'FIFA', nameAr: 'الفيفا', lang: 'en' },
  { id: 'UCyGa1YEx9ST66rYrJTGIKOw', name: 'UEFA', nameAr: 'اليويفا', lang: 'en' },
  { id: 'UCpryVRk_VDudG8SHXgWcG0w', name: 'Premier League', nameAr: 'الدوري الإنجليزي الممتاز', lang: 'en' },
  { id: 'UCTv-XvfzLX3i4IGWAm4sbmA', name: 'LALIGA', nameAr: 'الليغا', lang: 'en' },
  { id: 'UCBJeMCIeLQos7wacox4hmLQ', name: 'Serie A', nameAr: 'الدوري الإيطالي', lang: 'en' },
  { id: 'UC6UL29enLNe4mqwTfAyeNuw', name: 'Bundesliga', nameAr: 'البوندسليغا', lang: 'en' },
  { id: 'UCNAf1k0yIjyGu3k9BwAg3lg', name: 'Sky Sports Premier League', nameAr: 'سكاي سبورتس', lang: 'en' },
  { id: 'UCET00YnetHT7tOpu12v8jxg', name: 'CBS Sports Golazo', nameAr: 'CBS Sports Golazo', lang: 'en' },
  { id: 'UCWV3obpZVGgJ3j9FVhEjF2Q', name: 'Real Madrid', nameAr: 'ريال مدريد', lang: 'en' },
  { id: 'UC14UlmYlSNiQCBe9Eookf_A', name: 'FC Barcelona', nameAr: 'برشلونة', lang: 'en' },
  { id: 'UC9LQwHZoucFT94I2h6JOcjw', name: 'Liverpool FC', nameAr: 'ليفربول', lang: 'en' },
  { id: 'UCkzCjdRMrW2vXLx8mvPVLdQ', name: 'Manchester City', nameAr: 'مانشستر سيتي', lang: 'en' },
  { id: 'UCSZbXT5TLLW_i-5W8FZpFsg', name: 'Major League Soccer', nameAr: 'MLS', lang: 'en' },
];

export const YOUTUBE_KEEP = {
  VIDEO: 3,
  SHORT: 2,
} as const;

/** Official desks that disable playback on other sites. */
export const YOUTUBE_EMBED_BLOCKED = new Set([
  'UCJUCcJUeh0Cz2xyKwkw5Q1w', // beIN SPORTS
]);

export function channelById(id: string) {
  return FOOTBALL_YOUTUBE_CHANNELS.find((channel) => channel.id === id);
}

export function youtubeThumb(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeRssUrl(channelId: string) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

export function displayChannelName(channelId: string, fallback: string, locale: string) {
  const channel = channelById(channelId);
  if (!channel) return fallback;
  return locale === 'en' ? channel.name : channel.nameAr;
}
