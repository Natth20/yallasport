import { pick } from '@/i18n/pick';
import { Camera, Layers, LayoutGrid, Radio, ShieldCheck } from 'lucide-react';
import styles from '@/components/youtube/youtube.module.css';

export function PhotoBrief({
  locale,
  frames,
  sources,
}: {
  locale: string;
  frames: number;
  sources: number;
}) {
  const cells = [
    {
      dt: pick(locale, 'صور من التقارير', 'Report photos'),
      dd: String(frames),
      icon: Camera,
      hint: pick(locale, 'من التقارير المنشورة', 'From published reports'),
    },
    {
      dt: pick(locale, 'المصادر', 'Sources'),
      dd: String(sources),
      icon: Layers,
      hint: pick(locale, 'كما وصلت على المكتب', 'As filed on the desk'),
    },
    {
      dt: pick(locale, 'عدد الصور', 'Photos'),
      dd: String(frames),
      icon: LayoutGrid,
      hint: pick(locale, 'شبكة واحدة مرتّبة', 'One ordered grid'),
    },
  ];

  return (
    <aside className={styles['yt-brief']} aria-label={pick(locale, 'ملخص الصور', 'Photos brief')}>
      <div className={styles['yt-brief-header']}>
        <div className={styles['yt-brief-sync']}>
          <span className={styles['yt-sync-dot']} aria-hidden />
          <Radio size={14} className={styles['yt-sync-icon']} aria-hidden />
          <span className={styles['yt-sync-label']}>
            {pick(locale, 'الصور من التقارير المنشورة فقط', 'Photos come from published reports only')}
          </span>
        </div>
      </div>

      <div className={styles['yt-brief-grid']}>
        {cells.map((cell) => {
          const Icon = cell.icon;
          return (
            <div key={cell.dt} className={styles['yt-brief-card']}>
              <div className={styles['yt-card-top']}>
                <span className={styles['yt-card-icon-wrap']}>
                  <Icon size={16} aria-hidden />
                </span>
                <span className={styles['yt-card-hint']}>{cell.hint}</span>
              </div>
              <strong className={styles['yt-card-value']}>{cell.dd}</strong>
              <span className={styles['yt-card-label']}>{cell.dt}</span>
            </div>
          );
        })}
      </div>

      <div className={styles['yt-brief-footer']}>
        <div className={styles['yt-brief-notice']}>
          <ShieldCheck size={15} className={styles['yt-notice-icon']} aria-hidden />
          <p>
            {pick(
              locale,
              'لا استوديو مخترع. الصورة كما وصلت من المصدر مع التقرير المنشور، والتقرير يُفتح من الغرفة.',
              'No invented studio. The print arrives with the published report, and the story opens from the desk.',
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
