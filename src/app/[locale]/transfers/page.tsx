import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { loadTransferDesk } from '@/lib/transfers/load-desk';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { TransferFace } from '@/components/transfers/TransferFace';
import { ArrowLeftRight, BarChart3, CalendarDays, Radio, Trophy } from 'lucide-react';
import { TransferFilters } from '@/components/transfers/TransferFilters';
import { ClientTime } from '@/components/datetime/ClientTime';

export const revalidate = 90;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الانتقالات', 'Transfers'),
    description: pick(
      locale,
      'صفقات اللاعبين كما وصلت من المصدر: من وإلى، بلا اختراع.',
      'Player moves as they arrived from the source — from, to, no invented deals.',
    ),
    path: '/transfers',
  });
}

function monthLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ar-EG', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function groupByMonth<T extends { date: Date }>(rows: T[]) {
  const groups: Array<{ key: string; label: Date; rows: T[] }> = [];
  const index = new Map<string, number>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 7);
    const at = index.get(key);
    if (at == null) {
      index.set(key, groups.length);
      groups.push({ key, label: row.date, rows: [row] });
    } else {
      groups[at].rows.push(row);
    }
  }
  return groups;
}

export default function TransfersPage(props: {
  searchParams: Promise<{ club?: string; player?: string; season?: string; kind?: string; window?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <TransfersPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function TransfersPageBody({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; player?: string; season?: string; kind?: string; window?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const club = params.club?.trim() || '';
  const player = params.player?.trim() || '';
  const season = params.season?.trim() || '';
  const kind = params.kind?.trim() || '';
  const window = params.window?.trim() || '';
  const desk = await loadTransferDesk({ club, player, season, kind, window });
  const groups = groupByMonth(desk.rows);
  const paid = desk.rows.filter((row) => row.fee).length;
  const loans = desk.rows.filter((row) => row.kind === 'loan').length;
  const frees = desk.rows.filter((row) => row.kind === 'free').length;
  const tally = [
    { value: desk.rows.length, label: pick(locale, 'صفقة ظاهرة', 'Moves shown') },
    ...(paid > 0 ? [{ value: paid, label: pick(locale, 'برسم', 'With a fee') }] : []),
    ...(loans > 0 ? [{ value: loans, label: pick(locale, 'إعارة', 'Loans') }] : []),
    ...(frees > 0 ? [{ value: frees, label: pick(locale, 'انتقال حر', 'Free moves') }] : []),
  ];

  return (
    <SalonStage
      tone="market"
      kicker={pick(locale, 'سلك الميركاتو', 'Mercato wire')}
      title={pick(locale, 'الانتقالات', 'Transfers')}
      lead={pick(
        locale,
        `موسم ${desk.fromSeason}/${desk.fromSeason + 1} وموسم ${desk.seasonLabel}/${desk.seasonLabel + 1} من دفتر المصدر.`,
        `Seasons ${desk.fromSeason}/${desk.fromSeason + 1} and ${desk.seasonLabel}/${desk.seasonLabel + 1} from the source ledger.`,
      )}
      aside={pick(locale, `${desk.rows.length} صفقة`, `${desk.rows.length} moves`)}
      wide
      compact
      tools={
        <div className="salon-foyer">
          <HallFoyer
            label={pick(locale, 'جناح الملعب', 'Pitch suite')}
            items={[
              { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: CalendarDays },
              { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
              { href: '/leagues', label: pick(locale, 'البطولات', 'Leagues'), icon: Trophy },
              { href: '/transfers', label: pick(locale, 'الانتقالات', 'Transfers'), icon: ArrowLeftRight, current: true },
              { href: '/stats', label: pick(locale, 'إحصائيات', 'Stats'), icon: BarChart3 },
            ]}
          />
          <TransferFilters
            locale={locale}
            values={{ club, player, season, kind, window }}
            clubs={[
              { value: '', label: pick(locale, 'كل الأندية', 'All clubs') },
              ...desk.clubs.map((name) => ({ value: name, label: localizePlainName(locale, name) })),
            ]}
            players={[
              { value: '', label: pick(locale, 'كل اللاعبين', 'All players') },
              ...desk.players.slice(0, 120).map((row) => ({
                value: row.slug || row.name,
                label: localizePlainName(locale, row.name),
              })),
            ]}
            seasons={[
              { value: '', label: pick(locale, 'آخر موسمين', 'Last two seasons') },
              ...desk.seasons.map((year) => ({ value: String(year), label: `${year}/${year + 1}` })),
            ]}
          />
        </div>
      }
    >
      {desk.syncedAt ? (
        <p className="xfer-fresh">
          {pick(locale, 'آخر مزامنة', 'Last sync')}: <ClientTime value={desk.syncedAt} />
          {desk.source ? ` · ${desk.source}` : ''}
        </p>
      ) : null}

      {desk.rows.length > 0 ? (
        <div className="xfer-tally">
          {tally.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      ) : null}

      {desk.headline ? (
        <article className="xfer-hero">
          <TransferFace
            src={desk.headline.playerPhoto}
            name={localizePlainName(locale, desk.headline.playerName)}
          />
          <em>{pick(locale, 'أكبر صفقة موثقة', 'Largest verified fee')}</em>
          <strong>{localizePlainName(locale, desk.headline.playerName)}</strong>
          <span>
            {[desk.headline.fromTeam, desk.headline.toTeam].filter(Boolean).join(' → ')}
            {desk.headline.fee ? ` · ${desk.headline.fee}` : ''}
          </span>
        </article>
      ) : null}

      {desk.rows.length === 0 ? (
        <div className="salon-empty">
          <strong>{pick(locale, 'ما في صفقات من المصدر', 'No moves from the source')}</strong>
          <p>
            {pick(
              locale,
              'الدفتر فاضي بهالفلاتر. غيّر النادي أو الموسم، أو امسح الفلاتر. ما بنعرض صفقات مخترعة.',
              'The ledger is empty for these filters. Change club or season, or reset. We do not invent deals.',
            )}
          </p>
        </div>
      ) : (
        <div className="xfer-wire">
          {groups.map((group) => (
            <section key={group.key} className="xfer-month">
              <h2>{monthLabel(group.label, locale)}</h2>
              <ul className="xfer-list">
                {group.rows.map((row) => {
                  const name = localizePlainName(locale, row.playerName);
                  const from = row.fromTeam ? localizePlainName(locale, row.fromTeam) : '—';
                  const to = row.toTeam ? localizePlainName(locale, row.toTeam) : '—';
                  const inner = (
                    <>
                      <span className="xfer-who">
                        <TransferFace src={row.playerPhoto} name={name} />
                        {row.playerSlug ? (
                          <Link href={`/player/${row.playerSlug}`}>
                            <strong>{name}</strong>
                          </Link>
                        ) : (
                          <strong>{name}</strong>
                        )}
                      </span>
                      <span className="xfer-path">
                        {row.fromLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.fromLogo} alt="" />
                        ) : null}
                        {row.fromSlug ? <Link href={`/team/${row.fromSlug}`}>{from}</Link> : <em>{from}</em>}
                        <b aria-hidden>→</b>
                        {row.toLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.toLogo} alt="" />
                        ) : null}
                        {row.toSlug ? <Link href={`/team/${row.toSlug}`}>{to}</Link> : <em>{to}</em>}
                      </span>
                      <span className="xfer-meta">
                        <time>
                          {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ar-EG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC',
                          }).format(row.date)}
                        </time>
                        {row.type ? <em className={`xfer-kind is-${row.kind}`}>{localizePlainName(locale, row.type)}</em> : null}
                        {row.fee ? <em className="xfer-fee">{row.fee}</em> : null}
                      </span>
                    </>
                  );
                  return <li key={row.id}><div className={`xfer-row${row.fee ? ' is-fee' : ''}`}>{inner}</div></li>;
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </SalonStage>
  );
}
