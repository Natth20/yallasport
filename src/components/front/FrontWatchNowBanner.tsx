import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Radio, Tv, Play, ChevronLeft, ChevronRight, Sparkles, Activity } from 'lucide-react';
import styles from './front-design.module.css';

export async function FrontWatchNowBanner() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  return (
    <div className={styles.watchNowBanner} aria-label={ar ? 'بنر البث المباشر' : 'Live Match Center Banner'}>
      <div className={styles.watchNowAtmosphere} aria-hidden />

      <div className={styles.watchNowContent}>
        <div className={styles.watchNowBadgeRow}>
          <span className={styles.watchNowLiveTag}>
            <span className={styles.livePulseBeacon} />
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{ar ? 'يلا سبورت مباشر' : 'Yalla Sport Live'}</span>
          </span>
          <span className={styles.watchNowHdPill}>
            <Tv className="w-3 h-3 text-amber-400" />
            <span>FHD Ultra Low-Latency</span>
          </span>
          <span className={styles.watchNowHdPill} style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#34d399' }}>
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>{ar ? 'تغطية فورية' : 'Instant Feed'}</span>
          </span>
        </div>

        <h3 style={{ color: 'white' }} className={styles.watchNowTitle}>
          {ar ? 'مركز البث الحي والمباريات وجدول القنوات الناقلة' : 'Live Match Center & Real-Time Broadcasts'}
        </h3>

        <p className={styles.watchNowDesc}>
          {ar
            ? 'تابع البث الحي لحظة بلحظة، تغطية شاملة لكافة الأهداف، التشكيلات الرسمية، وتحليلات القمة من مصادر موثوقة.'
            : 'Watch live matches in real-time with official lineups, instant goal replays, and verified source statistics.'}
        </p>
      </div>

      <Link href="/live" className={styles.watchNowBtn}>
        <span className={styles.watchNowBtnIcon}>
          <Play className="w-4 h-4 fill-white text-white translate-x-[1px]" />
        </span>
        <span>{ar ? 'دخول غرفة البث المباشر' : 'Enter Live Match Room'}</span>
        {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Link>
    </div>
  );
}
