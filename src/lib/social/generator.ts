import { prisma } from '@/lib/prisma';
import { SocialPlatform } from './types';

export type MatchAlertType = 'KICKOFF' | 'FINAL_RESULT' | 'LIVE_UPDATE';

export interface GeneratedSocialPost {
  platform: SocialPlatform;
  content: string;
  mediaUrls: string[];
  suggestedTags: string[];
}

/**
 * Format match kickoff alert or final result into platform copy
 */
export async function generateSocialPostFromMatch(
  matchId: string,
  alertType: MatchAlertType,
  platform: SocialPlatform = 'TELEGRAM'
): Promise<GeneratedSocialPost | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true,
      venue: true,
      channels: {
        include: { channel: true },
      },
    },
  });

  if (!match) return null;

  const home = match.homeTeam.name || match.homeTeam.officialName || 'فريق';
  const away = match.awayTeam.name || match.awayTeam.officialName || 'فريق';
  const leagueName = match.league.name || 'البطولة';
  const kickoffTime = new Date(match.kickoffAt).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh',
  });
  const kickoffDate = new Date(match.kickoffAt).toLocaleDateString('ar-EG', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Riyadh',
  });

  const channelsList = match.channels
    .map((c) => c.channel.name)
    .filter(Boolean)
    .join('، ');

  const tags = [
    '#يلا_سبورت',
    `#${leagueName.replace(/\s+/g, '_')}`,
    `#${home.replace(/\s+/g, '_')}`,
    `#${away.replace(/\s+/g, '_')}`,
  ];

  let content = '';

  if (alertType === 'KICKOFF') {
    if (platform === 'TWITTER') {
      content = `⚽ قمة مرتقبة اليوم!
${home} 🆚 ${away}
🏆 ${leagueName}
⏰ ${kickoffTime} بتوقيت مكة
${channelsList ? `📺 الناقل: ${channelsList}\n` : ''}تابع التغطية المباشرة دقيقة بدقيقة عبر يلا سبورت ⬇️
${tags.slice(0, 3).join(' ')}`;
    } else {
      // Telegram / Facebook rich format
      content = `🔥 <b>صافرة البداية تقترب!</b>

⚔️ <b>${home}</b> 🆚 <b>${away}</b>
🏆 <b>البطولة:</b> ${leagueName}
📅 <b>الموعد:</b> ${kickoffDate}
⏰ <b>التوقيت:</b> ${kickoffTime} بتوقيت مكة المكرمة
${match.venue?.name ? `🏟️ <b>الملعب:</b> ${match.venue.name}\n` : ''}${channelsList ? `📺 <b>القناة الناقلة:</b> ${channelsList}\n` : ''}
⚡ لا تفوّت المتابعة الحية الحصرية للتشكيلات والأهداف عبر منصة يلا سبورت:
https://yallasport.net/ar/match/${match.id}

${tags.join(' ')}`;
    }
  } else if (alertType === 'FINAL_RESULT') {
    const homeScore = match.homeScore !== null ? match.homeScore : '-';
    const awayScore = match.awayScore !== null ? match.awayScore : '-';

    if (platform === 'TWITTER') {
      content = `🏁 صافرة النهاية!
${home} ${homeScore} - ${awayScore} ${away}
🏆 ${leagueName}
📊 تفاصيل المباراة وإحصائيات الأداء تجدونها على يلا سبورت ⬇️
https://yallasport.net/ar/match/${match.id}
${tags.slice(0, 3).join(' ')}`;
    } else {
      content = `🏁 <b>نهاية المباراة!</b>

⚔️ <b>${home}</b> ${homeScore} - ${awayScore} <b>${away}</b>
🏆 <b>البطولة:</b> ${leagueName}

📈 اطلع على إحصائيات الاستحواذ، تسديدات اللاعبين، وتقييمات الأداء الكاملة عبر الرابط:
https://yallasport.net/ar/match/${match.id}

${tags.join(' ')}`;
    }
  } else {
    // LIVE UPDATE
    const minute = match.minute ? `${match.minute}'` : 'مباشر';
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    content = `⚡ <b>تحديث مباشر (${minute})</b>
${home} ${homeScore} - ${awayScore} ${away}
🏆 ${leagueName}

شاهد الأهداف واللقطات اللحظية الآن:
https://yallasport.net/ar/match/${match.id}

${tags.slice(0, 3).join(' ')}`;
  }

  const mediaUrls: string[] = [];
  if (match.homeTeam.logoUrl) mediaUrls.push(match.homeTeam.logoUrl);

  return {
    platform,
    content: content.trim(),
    mediaUrls,
    suggestedTags: tags,
  };
}

/**
 * Format news article into platform breaking news copy
 */
export async function generateSocialPostFromNews(
  newsId: string,
  platform: SocialPlatform = 'TELEGRAM'
): Promise<GeneratedSocialPost | null> {
  const article = await prisma.news.findUnique({
    where: { id: newsId },
  });

  if (!article) return null;

  const isBreaking = article.breaking;
  const title = article.title;
  const summary = article.excerpt || '';
  const articleUrl = `https://yallasport.net/ar/news/${article.id}`;
  const category = article.category || 'أخبار الرياضة';

  const tags = [
    '#يلا_سبورت',
    `#${category.replace(/\s+/g, '_')}`,
    '#أخبار_الرياضة',
  ];

  let content = '';

  if (platform === 'TWITTER') {
    const prefix = isBreaking ? '🚨 عاجل | ' : '📰 ';
    const remainingLen = 280 - (prefix.length + articleUrl.length + tags.slice(0, 2).join(' ').length + 20);
    const cleanTitle = title.length > remainingLen ? `${title.slice(0, remainingLen - 3)}...` : title;

    content = `${prefix}${cleanTitle}

التفاصيل كاملة ⬇️
${articleUrl}

${tags.slice(0, 2).join(' ')}`;
  } else {
    // Telegram / Facebook
    const header = isBreaking ? '🚨 <b>عاجل | خبر رياضي</b>' : '📰 <b>يلا سبورت | متابعة إخبارية</b>';
    content = `${header}

📌 <b>${title}</b>

${summary ? `${summary}\n\n` : ''}🔗 <b>لقراءة الخبر كاملاً وتحليل التفاصيل:</b>
${articleUrl}

${tags.join(' ')}`;
  }

  const mediaUrls: string[] = [];
  if (article.featuredImage) {
    mediaUrls.push(article.featuredImage);
  }

  return {
    platform,
    content: content.trim(),
    mediaUrls,
    suggestedTags: tags,
  };
}
