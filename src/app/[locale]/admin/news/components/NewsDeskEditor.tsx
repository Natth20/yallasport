'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { pick } from '@/i18n/pick';

export type DeskNewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  featuredImage: string | null;
  ogImage: string | null;
  status: string;
  featured: boolean;
  breaking: boolean;
  isPremium: boolean;
  createdAt: Date | string;
  publishedAt: Date | string | null;
  slug?: string | null;
};

export function NewsDeskEditor({
  items,
  mode,
}: {
  items: DeskNewsItem[];
  mode: 'pending' | 'published';
}) {
  const locale = useLocale();
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DeskNewsItem>>({});

  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        ...(drafts[item.id] || {}),
      })),
    [items, drafts]
  );

  const patchDraft = (id: string, patch: Partial<DeskNewsItem>) => {
    setDrafts((prev) => {
      const base = prev[id] || items.find((item) => item.id === id)!;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  };

  const call = async (payload: Record<string, unknown>, id?: string) => {
    if (id) setBusyId(id);
    else setBusyId('batch');
    setError(null);
    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : pick(locale, 'تعذر تنفيذ الإجراء.', 'Could not complete the action.')
        );
        return null;
      }
      router.refresh();
      return data;
    } catch {
      setError(pick(locale, 'تعذر الاتصال بالخادم.', 'Could not reach the server.'));
      return null;
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground dark:border-border dark:bg-muted">
        {mode === 'pending'
          ? pick(locale, 'لا توجد أخبار بانتظار المراجعة.', 'No news awaiting review.')
          : pick(locale, 'لا توجد أخبار منشورة لعرضها.', 'No published news to display.')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {rows.map((item) => {
        const open = openId === item.id;
        const busy = busyId === item.id;
        const cover = item.featuredImage || item.ogImage;

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm dark:border-border dark:bg-background"
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-foreground sm:h-16 sm:w-28">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    {pick(locale, 'بلا صورة', 'No image')}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-bold text-foreground dark:text-foreground">{item.title}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.sourceName || pick(locale, 'مصدر', 'Source')}
                  {item.sourceUrl ? ` · ${item.sourceUrl.replace(/^https?:\/\//, '').slice(0, 42)}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewId(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-foreground dark:border-border dark:text-foreground/70"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {pick(locale, 'معاينة', 'Preview')}
                </button>
                {mode === 'pending' ? (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(busyId)}
                      onClick={() => void call({ id: item.id, action: 'approve' }, item.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {pick(locale, 'اعتماد', 'Approve')}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busyId)}
                      onClick={() => void call({ id: item.id, action: 'reject' }, item.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      {pick(locale, 'رفض', 'Reject')}
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-foreground dark:border-border dark:text-foreground/70"
                >
                  {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {pick(locale, 'تعديل التفاصيل', 'Edit details')}
                </button>
              </div>
            </div>

            {open ? (
              <div className="space-y-3 border-t border-border bg-muted/70 p-4 dark:border-border dark:bg-card/[0.02]">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
                    {pick(locale, 'العنوان', 'Title')}
                    <input
                      value={item.title}
                      onChange={(e) => patchDraft(item.id, { title: e.target.value })}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
                    {pick(locale, 'التصنيف', 'Category')}
                    <input
                      value={item.category}
                      onChange={(e) => patchDraft(item.id, { category: e.target.value })}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground md:col-span-2">
                    {pick(locale, 'المقتطف', 'Excerpt')}
                    <textarea
                      value={item.excerpt || ''}
                      onChange={(e) => patchDraft(item.id, { excerpt: e.target.value })}
                      rows={2}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground md:col-span-2">
                    {pick(locale, 'المحتوى الكامل', 'Full content')}
                    <textarea
                      value={item.content}
                      onChange={(e) => patchDraft(item.id, { content: e.target.value })}
                      rows={8}
                      className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs leading-6 dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
                    {pick(locale, 'اسم المصدر', 'Source name')}
                    <input
                      value={item.sourceName || ''}
                      onChange={(e) => patchDraft(item.id, { sourceName: e.target.value })}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
                    {pick(locale, 'رابط المصدر', 'Source URL')}
                    <input
                      value={item.sourceUrl || ''}
                      onChange={(e) => patchDraft(item.id, { sourceUrl: e.target.value })}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground md:col-span-2">
                    {pick(locale, 'صورة الغلاف (رابط حقيقي)', 'Cover image (real URL)')}
                    <input
                      value={item.featuredImage || ''}
                      onChange={(e) =>
                        patchDraft(item.id, {
                          featuredImage: e.target.value,
                          ogImage: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground md:col-span-2">
                    {pick(locale, 'الوسوم (مفصولة بفاصلة)', 'Tags (comma separated)')}
                    <input
                      value={item.tags.join(', ')}
                      onChange={(e) =>
                        patchDraft(item.id, {
                          tags: e.target.value
                            .split(/[,،]/)
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-4 text-[11px] font-bold text-foreground dark:text-foreground/70">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.featured}
                      onChange={(e) => patchDraft(item.id, { featured: e.target.checked })}
                    />
                    {pick(locale, 'غلاف', 'Featured')}
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.breaking}
                      onChange={(e) => patchDraft(item.id, { breaking: e.target.checked })}
                    />
                    {pick(locale, 'عاجل', 'Breaking')}
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.isPremium}
                      onChange={(e) => patchDraft(item.id, { isPremium: e.target.checked })}
                    />
                    {pick(locale, 'مميز', 'Premium')}
                  </label>
                  <label className="inline-flex items-center gap-2">
                    {pick(locale, 'الحالة', 'Status')}
                    <select
                      value={item.status}
                      onChange={(e) => patchDraft(item.id, { status: e.target.value })}
                      className="rounded-md border border-border bg-card px-2 py-1 dark:border-border dark:bg-background"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() =>
                      void call(
                        {
                          id: item.id,
                          action: 'save',
                          title: item.title,
                          excerpt: item.excerpt,
                          content: item.content,
                          category: item.category,
                          sourceName: item.sourceName,
                          sourceUrl: item.sourceUrl,
                          featuredImage: item.featuredImage,
                          ogImage: item.ogImage || item.featuredImage,
                          tags: item.tags.join(', '),
                          featured: item.featured,
                          breaking: item.breaking,
                          isPremium: item.isPremium,
                          status: item.status,
                          fetchImage: !item.featuredImage,
                        },
                        item.id
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-bold text-primary-foreground hover:bg-orange-600 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {pick(locale, 'حفظ كل التفاصيل', 'Save all details')}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={() => void call({ id: item.id, action: 'enrich-one' }, item.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    {pick(locale, 'جلب صورة من المصدر', 'Fetch image from source')}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyId)}
                    onClick={async () => {
                      const data = await call({ id: item.id, action: 'enrich-body' }, item.id);
                      if (data?.content) {
                        patchDraft(item.id, {
                          content: data.content as string,
                          featuredImage: (data.featuredImage as string) || item.featuredImage,
                          ogImage: (data.featuredImage as string) || item.ogImage,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {pick(locale, 'سحب النص الكامل من المصدر', 'Pull full text from source')}
                  </button>
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-bold text-foreground dark:border-border dark:text-foreground/70"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {pick(locale, 'فتح الأصل', 'Open original')}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </article>
        );
      })}

      {previewId
        ? (() => {
            const item = rows.find((row) => row.id === previewId);
            if (!item) return null;
            const cover = item.featuredImage || item.ogImage;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-white/10 bg-card text-foreground shadow-2xl">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-card/90 px-5 py-3 backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400">
                      {pick(locale, 'معاينة الزائر', 'Visitor preview')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewId(null)}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70"
                    >
                      {pick(locale, 'إغلاق', 'Close')}
                    </button>
                  </div>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="max-h-64 w-full object-cover" />
                  ) : null}
                  <div className="space-y-4 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400">
                      {item.category}
                      {item.breaking ? ` · ${pick(locale, 'عاجل', 'Breaking')}` : ''}
                    </p>
                    <h2 className="text-2xl font-black tracking-tight text-white">{item.title}</h2>
                    {item.excerpt ? <p className="text-sm leading-7 text-white/60">{item.excerpt}</p> : null}
                    <p className="text-[11px] text-white/40">
                      {item.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
                      {item.sourceUrl ? ` · ${item.sourceUrl}` : ''}
                    </p>
                    <div
                      className="prose prose-invert max-w-none text-sm leading-7 prose-a:text-orange-300"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </div>
                </div>
              </div>
            );
          })()
        : null}
    </div>
  );
}

export function EnrichNewsImagesButton() {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enrich-images' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(typeof data.error === 'string' ? data.error : pick(locale, 'فشل التحديث.', 'Update failed.'));
        return;
      }
      setMessage(
        pick(
          locale,
          `تم تحديث ${data.updated || 0} خبر بصورة حقيقية من المصدر.`,
          `Updated ${data.updated || 0} stories with real source images.`
        )
      );
      router.refresh();
    } catch {
      setMessage(pick(locale, 'تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-60 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {pick(locale, 'تحديث صور الأخبار الناقصة', 'Backfill missing news images')}
      </button>
      {message ? <p className="max-w-xs text-[11px] text-muted-foreground sm:text-end">{message}</p> : null}
    </div>
  );
}
