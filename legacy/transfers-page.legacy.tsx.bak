import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { loadTransferDesk } from '@/lib/transfers/load-desk';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { SalonStage } from '@/components/salon/SalonStage';
import { TransferFilters } from '@/components/transfers/TransferFilters';
import { ClientTime } from '@/components/datetime/ClientTime';

export const revalidate = 120;

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

  return (
    <SalonStage
      tone="wire"
      kicker={pick(locale, 'سلك الميركاتو', 'Mercato wire')}
      title={pick(locale, 'الانتقالات', 'Transfers')}
      lead={pick(
        locale,
        `موسم ${desk.fromSeason}/${desk.fromSeason + 1} وموسم ${desk.seasonLabel}/${desk.seasonLabel + 1} من دفتر المصدر.`,
        `Seasons ${desk.fromSeason}/${desk.fromSeason + 1} and ${desk.seasonLabel}/${desk.seasonLabel + 1} from the source ledger.`,
      )}
      aside={pick(locale, `${desk.rows.length} صفقة`, `${desk.rows.length} moves`)}
      tools={
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
      }
    >
      {desk.syncedAt ? (
        <p className="xfer-fresh">
          {pick(locale, 'آخر مزامنة', 'Last sync')}: <ClientTime value={desk.syncedAt} />
          {desk.source ? ` · ${desk.source}` : ''}
        </p>
      ) : null}

      {desk.headline ? (
        <article className="xfer-hero">
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
          <strong>{pick(locale, 'ما في صفقات', 'No moves')}</strong>
          <p>{pick(locale, 'ما في انتقالات بهالفلاتر من المصدر.', 'No transfers from the source for these filters.')}</p>
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
                        {row.playerPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.playerPhoto} alt="" />
                        ) : (
                          <i>{name.charAt(0)}</i>
                        )}
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
