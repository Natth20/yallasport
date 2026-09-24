import { reportCaughtError } from '@/lib/ops/caught';
function isDataSaverOn(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.dataSaver === 'on') {
    return true;
  }
  if (typeof localStorage === 'undefined') return false;
  try {
    return JSON.parse(localStorage.getItem('yalla-data-saver') || 'false') === true;
  } catch (error) {
    reportCaughtError("src/lib/streaming/network-cap.ts:8", error);
    return false;
  }
}

/** Soft cap for ABR / auto quality. Data saver always caps at 480p. */
export function networkMaxHeight(): number | null {
  if (typeof navigator === 'undefined') return null;
  if (isDataSaverOn()) return 480;

  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number };
    }
  ).connection;
  if (!connection) return null;
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return 360;
  if (connection.effectiveType === '3g') return 720;
  if (typeof connection.downlink === 'number' && connection.downlink > 0 && connection.downlink < 1.5) {
    return 480;
  }
  return null;
}

export function networkAutoCopy(locale: string) {
  if (isDataSaverOn()) {
    return locale === 'ar'
      ? 'وضع توفير البيانات مفعّل: الجودة التلقائية محدودة عند 480p لتقليل الاستهلاك.'
      : 'Data saver is on: Auto quality is capped at 480p to reduce usage.';
  }

  const cap = networkMaxHeight();
  if (cap == null) {
    return locale === 'ar'
      ? 'الجودة التلقائية تختار الطبقة الأنسب لشبكتك. الطبقات الأخرى تظهر داخل المشغّل إن وفرها المصدر.'
      : 'Auto quality picks the layer that fits your network. Other layers appear in the player if the source provides them.';
  }
  return locale === 'ar'
    ? `شبكتك الآن تناسب حتى ${cap}p كحد أعلى تلقائي. يمكنك تثبيت طبقة أعلى أو أدنى من المصدر داخل المشغّل.`
    : `Your network currently caps Auto at ${cap}p. You can lock a higher or lower source layer in the player.`;
}
