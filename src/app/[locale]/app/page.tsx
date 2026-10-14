import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Zap,
  WifiOff,
  Bell,
  Clock,
  AlertCircle,
  Share,
  PlusSquare,
} from 'lucide-react';
import styles from './app.module.css';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'تطبيق يلا سبورت — تثبيت تطبيق الويب والمتاجر', 'Yalla Sport App — PWA & App Stores'),
    description: pick(
      locale,
      'حمّل وثبّت تطبيق يلا سبورت على هاتفك مجاناً: تابع المباريات المباشرة، إشعارات الأهداف، ونتائج البطولات مع وضع توفير البيانات ودعم العمل دون اتصال.',
      'Download and install Yalla Sport app on your device: live match tracker, instant goal alerts, data saver mode, and offline capability.'
    ),
    path: '/app',
  });
}

export default async function YallaSportAppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';

  const features = [
    {
      icon: Zap,
      title: ar ? 'سرعة فائقة وخفة تامة' : 'Blazing Fast & Ultra Light',
      desc: ar ? 'لا يستهلك مساحة تخزين هاتفك، يفتح فورياً بدون انتظار أو ثقل.' : 'Requires minimal storage, loads instantly with zero lag.',
    },
    {
      icon: Bell,
      title: ar ? 'إشعارات الأهداف المباشرة' : 'Instant Match & Goal Alerts',
      desc: ar ? 'تصلك تنبيهات انطلاق المباريات والأهداف لحظة اهتزاز الشباك.' : 'Live kickoff reminders and instant goal notifications.',
    },
    {
      icon: WifiOff,
      title: ar ? 'وضع التصفح دون اتصال' : 'Offline Access',
      desc: ar ? 'تصفح آخر الأخبار والنتائج المحفوظة حتى عند انقطاع الاتصال.' : 'Browse saved scores and latest stories even while offline.',
    },
    {
      icon: Smartphone,
      title: ar ? 'توفير استهلاك البيانات' : 'Data Saver Mode',
      desc: ar ? 'تقنية حصرية لضغط البيانات لتقليل استهلاك باقة الإنترنت لأدنى حد.' : 'Exclusive data compression to preserve your mobile plan.',
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <Smartphone className="h-4 w-4" />
          <span>{ar ? 'تطبيق يلا سبورت الذكي' : 'Yalla Sport Smart App'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'يلا سبورت معك في كل لحظة وعلى أي جهاز' : 'Yalla Sport With You On Every Device'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'ثبّت تطبيق يلا سبورت الآن كـ تطبيق ويب تقدمي (PWA) على هاتفك الآيفون أو الأندرويد أو الحاسوب بضغطة زر واحدة مجاناً.'
            : 'Install Yalla Sport instantly as a Progressive Web App (PWA) on your iPhone, Android, or desktop with a single tap.'}
        </p>

        {/* Development & Stores Status Notice */}
        <div className={styles.storeStatus}>
          <div className={styles.statusIcon}>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className={styles.statusContent}>
            <h2 className={styles.statusHeading}>
              {ar
                ? 'حالة التوفر: تثبيت الويب الفوري (PWA) متاح الآن — تطبيقات المتاجر قريباً'
                : 'Availability Status: Direct Web PWA Active Now — App Stores in Final Review'}
            </h2>
            <p className={styles.statusDesc}>
              {ar
                ? 'تطبيق الويب التقدمي (PWA) يعمل بكامل ميزاته فوراً دون الحاجة لمتجر. نسخ تطبيقات App Store و Google Play قيد المراجعة والاعتماد النهائي لدى المتاجر الرسمية وسيتم الإعلان عنها فور طرحها.'
                : 'The PWA runs at full performance today with no store download required. Native App Store and Google Play builds are under review and will be announced once live.'}
            </p>
          </div>
        </div>
      </header>

      {/* Installation guides */}
      <section className={styles.installGuides}>
        <div className={styles.guideCard}>
          <div className={styles.guideBadge}>iOS / iPhone / iPad</div>
          <h2 className={styles.guideTitle}>
            {ar ? 'طريقة التثبيت على الآيفون والآيباد' : 'Install on iPhone & iPad'}
          </h2>
          <ol className={styles.steps}>
            <li>
              <span className={styles.stepNum}>1</span>
              <div>
                <strong>{ar ? 'افتح الموقع في متصفح Safari' : 'Open in Safari'}</strong>
                <p>{ar ? 'تأكد من فتح رابط موقع يلا سبورت في متصفح سفاري.' : 'Ensure you open Yalla Sport in Safari browser.'}</p>
              </div>
            </li>
            <li>
              <span className={styles.stepNum}>2</span>
              <div>
                <strong>{ar ? 'اضغط على زر المشاركة' : 'Tap the Share icon'}</strong>
                <p>
                  <Share className="h-4 w-4 inline-block mx-1 text-sky-400" />
                  {ar ? 'الموجود أسفل شاشة المتصفح.' : 'located at the bottom navigation bar.'}
                </p>
              </div>
            </li>
            <li>
              <span className={styles.stepNum}>3</span>
              <div>
                <strong>{ar ? 'اختر "إضافة إلى الصفحة الرئيسية"' : 'Select "Add to Home Screen"'}</strong>
                <p>
                  <PlusSquare className="h-4 w-4 inline-block mx-1 text-emerald-400" />
                  {ar ? 'سيظهر رمز تطبيق يلا سبورت على شاشتك فوراً.' : 'The Yalla Sport icon will appear on your home screen.'}
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className={styles.guideCard}>
          <div className={styles.guideBadge}>Android / Chrome</div>
          <h2 className={styles.guideTitle}>
            {ar ? 'طريقة التثبيت على هواتف الأندرويد' : 'Install on Android Devices'}
          </h2>
          <ol className={styles.steps}>
            <li>
              <span className={styles.stepNum}>1</span>
              <div>
                <strong>{ar ? 'افتح الموقع في متصفح Google Chrome' : 'Open in Google Chrome'}</strong>
                <p>{ar ? 'ادخل إلى موقع يلا سبورت من هاتفك.' : 'Navigate to Yalla Sport on your Android phone.'}</p>
              </div>
            </li>
            <li>
              <span className={styles.stepNum}>2</span>
              <div>
                <strong>{ar ? 'اضغط على زر الخيارات (النقاط الثلاث)' : 'Tap the 3-dots Menu'}</strong>
                <p>{ar ? 'في الزاوية العليا للمتصفح.' : 'at the top right/left corner of Chrome.'}</p>
              </div>
            </li>
            <li>
              <span className={styles.stepNum}>3</span>
              <div>
                <strong>{ar ? 'اضغط على "تثبيت التطبيق"' : 'Tap "Install App" or "Add to Home"'}</strong>
                <p>{ar ? 'سيبدأ التثبيت الفوري ويعمل كأي تطبيق أصلي بهاتفك.' : 'The app will be installed with full offline support.'}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Feature showcase */}
      <section className={styles.featuresSection}>
        <h2 className={styles.featuresHeading}>
          {ar ? 'أبرز مميزات تطبيق يلا سبورت' : 'Key Features of Yalla Sport App'}
        </h2>
        <div className={styles.featuresGrid}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className={styles.featureItem}>
                <div className={styles.featureIconWrap}>
                  <Icon className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className={styles.featureTitle}>{feat.title}</h3>
                  <p className={styles.featureDesc}>{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
