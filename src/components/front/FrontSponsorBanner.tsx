import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import styles from './front-design.module.css';

export async function FrontSponsorBanner() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  return (
    <div className={styles.sponsorGreenBanner}>
      <div className={styles.sponsorGreenContent}>
        <span style={{ fontSize: '1.75rem' }}>🎁</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>
            {ar ? 'احصل على أحدث الخصومات والمفاجآت الحصرية' : 'Get exclusive sports rewards & partner discounts'}
          </h4>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>
            {ar ? 'عروض وباقات خاصة لمتابعي منصة يلا سبورت في كل مكان.' : 'Special packages and offers for Yalla Sport community.'}
          </p>
        </div>
      </div>

      <Link href="/subscribe" className={styles.sponsorGreenBtn}>
        {ar ? 'اكتشف المزيد' : 'Explore more'}
      </Link>
    </div>
  );
}
