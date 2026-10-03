'use client';

import { useRouter } from '@/i18n/navigation';

type Opt = { value: string; label: string };

export function TransferFilters({
  locale,
  values,
  clubs,
  players,
  seasons,
}: {
  locale: string;
  values: { club: string; player: string; season: string; kind: string; window: string; direction: string };
  clubs: Opt[];
  players: Opt[];
  seasons: Opt[];
}) {
  const router = useRouter();
  const ar = locale === 'ar';

  const apply = (patch: Partial<typeof values>) => {
    const next = { ...values, ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const search = params.toString();
    router.push(search ? `/transfers?${search}` : '/transfers');
  };

  return (
    <form className="salon-form" onSubmit={(event) => event.preventDefault()}>
      <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {ar ? 'النادي' : 'Club'}
        <select value={values.club} onChange={(e) => apply({ club: e.target.value })}>
          {clubs.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {ar ? 'اللاعب' : 'Player'}
        <select value={values.player} onChange={(e) => apply({ player: e.target.value })}>
          {players.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[8rem] flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {ar ? 'الموسم' : 'Season'}
        <select value={values.season} onChange={(e) => apply({ season: e.target.value })}>
          {seasons.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[8rem] flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {ar ? 'النوع' : 'Type'}
        <select value={values.kind} onChange={(e) => apply({ kind: e.target.value })}>
          <option value="">{ar ? 'كل الصفقات' : 'All deals'}</option>
          <option value="move">{ar ? 'رسمي' : 'Official'}</option>
          <option value="loan">{ar ? 'إعارة' : 'Loan'}</option>
          <option value="free">{ar ? 'حر' : 'Free'}</option>
          <option value="rumour">{ar ? 'غير مؤكد' : 'Unconfirmed'}</option>
        </select>
      </label>
      <label className="flex min-w-[8rem] flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {ar ? 'النافذة' : 'Window'}
        <select value={values.window} onChange={(e) => apply({ window: e.target.value })}>
          <option value="">{ar ? 'كل الفترات' : 'All windows'}</option>
          <option value="summer">{ar ? 'صيف' : 'Summer'}</option>
          <option value="winter">{ar ? 'شتاء' : 'Winter'}</option>
        </select>
      </label>
      <label className="flex min-w-[8rem] flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {ar ? 'الاتجاه' : 'Direction'}
        <select value={values.direction} onChange={(e) => apply({ direction: e.target.value })}>
          <option value="">{ar ? 'قادم ومغادر' : 'In and out'}</option>
          <option value="in">{ar ? 'قادمون' : 'Incoming'}</option>
          <option value="out">{ar ? 'مغادرون' : 'Outgoing'}</option>
        </select>
      </label>
      {Object.values(values).some(Boolean) ? (
        <button type="button" className="salon-reset" onClick={() => router.push('/transfers')}>
          {ar ? 'مسح الفلاتر' : 'Reset'}
        </button>
      ) : null}
    </form>
  );
}
