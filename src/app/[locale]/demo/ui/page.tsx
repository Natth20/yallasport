'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from '@/components/ui';
import styles from './demo-ui.module.css';

export default function UIDemoPage() {
  const [activeModal, setActiveModal] = useState<'sm' | 'md' | 'lg' | null>(null);
  const [searchValue, setSearchValue] = useState('ريال مدريد');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('yallaSport#2026');

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.heroHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>
            <span>⚽ مكتبة مكونات YallaSport UI</span>
            <Badge variant="live">LIVE DEMO</Badge>
          </h1>
          <div className={styles.flexRow}>
            <Badge variant="primary">Next.js 16</Badge>
            <Badge variant="accent">Cairo Font</Badge>
            <Badge variant="outline">Tailwind v4 + Modules</Badge>
          </div>
        </div>
        <p className={styles.pageSubtitle}>
          معاينة بصرية وتفاعلية للمكونات الأساسية (Button, Card, Badge, Input, Tabs, Modal) المبنية بنظام التصميم الموحد بدون أي !important.
        </p>
      </header>

      {/* 1. BUTTONS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>1. الأزرار (Buttons)</h2>
          <Badge variant="default">7 Variants & 4 Sizes</Badge>
        </div>

        <div className={styles.gridCards}>
          <div className={styles.demoBox}>
            <h3 className={styles.demoBoxTitle}>أنماط الأزرار (Variants)</h3>
            <div className={styles.flexRow}>
              <Button variant="primary">أساسي (Primary)</Button>
              <Button variant="accent">تفاعلي (Accent)</Button>
              <Button variant="secondary">ثانوي (Secondary)</Button>
              <Button variant="outline">إطار (Outline)</Button>
              <Button variant="ghost">شفاف (Ghost)</Button>
              <Button variant="danger">حذف / خطر (Danger)</Button>
              <Button variant="link">رابط (Link)</Button>
            </div>
          </div>

          <div className={styles.demoBox}>
            <h3 className={styles.demoBoxTitle}>الأحجام والحالات (Sizes & States)</h3>
            <div className={styles.flexRow}>
              <Button size="sm" variant="accent">صغير SM</Button>
              <Button size="md" variant="primary">قياسي MD</Button>
              <Button size="lg" variant="primary">كبير LG</Button>
              <Button size="icon" variant="outline" aria-label="بحث">🔍</Button>
              <Button variant="primary" isLoading>جاري التحميل</Button>
              <Button variant="accent" disabled>معطّل</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BADGES SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>2. الشارات والمؤشرات (Badges)</h2>
          <Badge variant="live">Live Ping Animation</Badge>
        </div>

        <div className={styles.gridCards}>
          <div className={styles.demoBox}>
            <h3 className={styles.demoBoxTitle}>شارات الحالات الرياضية</h3>
            <div className={styles.flexRow}>
              <Badge variant="live">مباشر الآن</Badge>
              <Badge variant="primary" dot>جارية الدقيقة 74&apos;</Badge>
              <Badge variant="accent">قمة الجولة</Badge>
              <Badge variant="success">فوز (3 - 1)</Badge>
              <Badge variant="danger">بطاقة حمراء</Badge>
              <Badge variant="warning">تحت المراجعة VAR</Badge>
              <Badge variant="outline">الدوري الإنجليزي</Badge>
              <Badge variant="default">لم تبدأ بعد</Badge>
            </div>
          </div>

          <div className={styles.demoBox}>
            <h3 className={styles.demoBoxTitle}>أحجام الشارات</h3>
            <div className={styles.flexRow}>
              <Badge size="sm" variant="accent">صغير SM</Badge>
              <Badge size="md" variant="primary">متوسط MD</Badge>
              <Badge size="lg" variant="live">كبير LG</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARDS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>3. البطاقات (Cards)</h2>
          <Badge variant="default">6 Variants</Badge>
        </div>

        <div className={styles.gridCards}>
          <Card variant="default">
            <CardHeader>
              <CardTitle>بطاقة قياسية (Default)</CardTitle>
              <CardDescription>خلفية بطاقة نقية مع ظل خفيف</CardDescription>
            </CardHeader>
            <CardContent>
              <p>تستخدم لعرض معلومات الفرق وجداول المباريات والأخبار السريعة.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">التفاصيل</Button>
            </CardFooter>
          </Card>

          <Card variant="accent">
            <CardHeader>
              <div className={styles.flexRow} style={{ justifyContent: 'space-between' }}>
                <CardTitle>مباراة مميزة (Accent)</CardTitle>
                <Badge variant="live">ديربي مدريد</Badge>
              </div>
              <CardDescription>شريط علوي برتقالي جذاب</CardDescription>
            </CardHeader>
            <CardContent>
              <p>ريال مدريد 2 - 1 أتلتيكو مدريد (نهاية الشوط الأول)</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="accent">شاهد البث</Button>
            </CardFooter>
          </Card>

          <Card variant="interactive">
            <CardHeader>
              <CardTitle>بطاقة تفاعلية (Interactive)</CardTitle>
              <CardDescription>ترتفع بسلاسة عند التمرير (Hover Lift)</CardDescription>
            </CardHeader>
            <CardContent>
              <p>مثالية لقوائم الأخبار واللاعبين عند النقر للانتقال لصفحة التفاصيل.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="ghost">عرض الملف ←</Button>
            </CardFooter>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>بطاقة زجاجية (Glassmorphic)</CardTitle>
              <CardDescription>Backdrop Blur 12px مصقول</CardDescription>
            </CardHeader>
            <CardContent>
              <p>تعطي مظهراً فخماً وعصرياً للبطاقات العائمة وقوائم الإحصائيات.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">متابعة</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 4. INPUTS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>4. حقول الإدخال والبحث (Inputs)</h2>
          <Badge variant="default">All States & Types</Badge>
        </div>

        <div className={styles.inputsGrid}>
          <Input
            label="البحث السريع (Clearable Search)"
            placeholder="ابحث عن فريق، لاعب، بطولة..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            isClearable
            onClear={() => setSearchValue('')}
            leftIcon={<span>🔍</span>}
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="fan@yallasport.com"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            helperText="لن نشارك بريدك مع أي جهة خارجية"
            leftIcon={<span>✉️</span>}
          />

          <Input
            label="كلمة المرور (Toggle Password)"
            type="password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
          />

          <Input
            label="حقل بحالة خطأ (Error State)"
            defaultValue="wrong-value"
            error="الرمز المدخل غير صالح، يرجى المحاولة مجدداً"
          />

          <Input
            label="حقل معطّل (Disabled)"
            defaultValue="حساب موثق ومقفل"
            disabled
          />
        </div>
      </section>

      {/* 5. TABS SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>5. أشرطة التبويب (Tabs)</h2>
          <Badge variant="default">Pills, Underline & Default</Badge>
        </div>

        <div className={styles.gridCards}>
          <div className={styles.demoBox}>
            <h3 className={styles.demoBoxTitle}>تبويبات الحبوب (Pills Variant)</h3>
            <Tabs defaultValue="overview" variant="pills">
              <TabsList>
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="lineup">التشكيلة</TabsTrigger>
                <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
                <TabsTrigger value="h2h">المواجهات السابقة</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Card variant="bordered" padding="sm" style={{ marginTop: '0.75rem' }}>
                  ملخص المباراة والأحداث الرئيسية والتبديلات المسجلة.
                </Card>
              </TabsContent>
              <TabsContent value="lineup">
                <Card variant="bordered" padding="sm" style={{ marginTop: '0.75rem' }}>
                  خطة الفريقين (4-3-3) والتشكيلة الأساسية والاحتياطية.
                </Card>
              </TabsContent>
              <TabsContent value="stats">
                <Card variant="bordered" padding="sm" style={{ marginTop: '0.75rem' }}>
                  نسبة الاستحواذ: 58% - 42% | التسديدات: 14 - 8.
                </Card>
              </TabsContent>
              <TabsContent value="h2h">
                <Card variant="bordered" padding="sm" style={{ marginTop: '0.75rem' }}>
                  سجل آخر 5 مواجهات بين الفريقين.
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className={styles.demoBox}>
            <h3 className={styles.demoBoxTitle}>تبويبات الخط السفلي (Underline Variant)</h3>
            <Tabs defaultValue="standings" variant="underline">
              <TabsList>
                <TabsTrigger value="standings">جدول الترتيب</TabsTrigger>
                <TabsTrigger value="scorers">الهدافون</TabsTrigger>
                <TabsTrigger value="assists">صناع اللعب</TabsTrigger>
              </TabsList>
              <TabsContent value="standings">
                <Card variant="bordered" padding="sm" style={{ marginTop: '0.75rem' }}>
                  1. الهلال (68 ن) | 2. النصر (65 ن) | 3. الأهلي (58 ن)
                </Card>
              </TabsContent>
              <TabsContent value="scorers">
                <Card variant="bordered" padding="sm" style={{ marginTop: '0.75rem' }}>
                  1. ميتروفيتش (22 هدف) | 2. رونالدو (21 هدف)
                </Card>
              </TabsContent>
              <TabsContent value="assists">
                <Card variant="bordered" padding="sm" style={{ marginTop: '0.75rem' }}>
                  1. رياض محرز (13 صناعة) | 2. مالكوم (11 صناعة)
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* 6. MODAL SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>6. النوافذ المنبثقة (Modals)</h2>
          <Badge variant="default">Interactive Overlay</Badge>
        </div>

        <div className={styles.demoBox}>
          <h3 className={styles.demoBoxTitle}>انقر لفتح النافذة بالحجم المطلوب</h3>
          <div className={styles.flexRow}>
            <Button variant="primary" onClick={() => setActiveModal('sm')}>
              نافذة صغيرة (SM)
            </Button>
            <Button variant="accent" onClick={() => setActiveModal('md')}>
              نافذة متوسطة (MD - الافتراضية)
            </Button>
            <Button variant="outline" onClick={() => setActiveModal('lg')}>
              نافذة كبيرة (LG)
            </Button>
          </div>
        </div>
      </section>

      {/* Render Active Modal */}
      {activeModal && (
        <Modal
          isOpen={true}
          size={activeModal}
          onClose={() => setActiveModal(null)}
        >
          <ModalHeader>
            <ModalTitle>⚽ تفاصيل البث المباشر والمباراة</ModalTitle>
            <ModalDescription>
              نافذة منبثقة تفاعلية تدعم مفتاح ESC، والنقر خارج النافذة، وقفل التمرير.
            </ModalDescription>
          </ModalHeader>
          <ModalContent>
            <p>
              مرحباً بك في منصة يلا سبورت! هذه المعاينة تثبت كفاءة مكوّن الـ Modal بحجم <strong>{activeModal.toUpperCase()}</strong> مع خلفية ضبابية وتأثير تكبير ناعم عند الظهور.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <Input label="سجل تعليقك المباشر" placeholder="اكتب رأيك حول مجريات المباراة..." />
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={() => setActiveModal(null)}>
              تأكيد وحفظ
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
