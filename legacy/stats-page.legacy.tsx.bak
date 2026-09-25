import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { loadStatsDesk, STAT_BOARDS, type StatKind } from '@/lib/stats/load-desk';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { SalonStage } from '@/components/salon/SalonStage';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';


export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الإحصائيات', 'Statistics'),
    description: pick(
      locale,
      'هدافون وصنّاع وبطاقات من المصدر لهذا الموسم.',
      'Scorers, assists, and cards from the source for this season.',
    ),
    path: '/stats',
  });
}

function parseKind(raw?: string): StatKind {
  if (raw === 'assists' || raw === 'yellow' || raw === 'red') return raw;
  return 'goals';
}

export default function StatsPage(props: {
  searchParams: Promise<{ league?: string; kind?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <StatsPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function StatsPageBody({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; kind?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const leagueId = STAT_BOARDS.some((row) => row.id === params.league) ? params.league! : STAT_BOARDS[0].id;
  const kind = parseKind(params.kind);
  const desk = await loadStatsDesk(leagueId, kind);

  const kinds: Array<{ value: StatKind; label: string }> = [
    { value: 'goals', label: pick(locale, 'الأهداف', 'Goals') },
    { value: 'assists', label: pick(locale, 'الصناعات', 'Assists') },
    { value: 'yellow', label: pick(locale, 'صفراء', 'Yellow') },
    { value: 'red', label: pick(locale, 'حمراء', 'Red') },
  ];

  const href = (next: { league?: string; kind?: StatKind }) => {
    const q = new URLSearchParams();
    q.set('league', next.league || leagueId);
    q.set('kind', next.kind || kind);
    return `/stats?${q.toString()}`;
  };

  return (
    <SalonStage
      tone="podium"
      kicker={pick(locale, 'منصة الأرقام', 'The board')}
      title={pick(locale, 'الإحصائيات', 'Statistics')}
      lead={
        desk.previousSeason
          ? pick(
              locale,
              `المصدر ما رجّع لوحة للموسم الحالي بعد. الأرقام من موسم ${desk.season}/${desk.season + 1} كما وصلت.`,
              `The source has not returned a board for the live season yet. Figures are ${desk.season}/${desk.season + 1} as filed.`,
            )
          : pick(
              locale,
              `موسم ${desk.season}/${desk.season + 1} من المصدر. العداد يتغيّر مع الجولات، مو تقدير.`,
              `${desk.season}/${desk.season + 1} from the source. The count moves with matchdays — not an estimate.`,
            )
      }
      aside={locale === 'en' ? STAT_BOARDS.find((b) => b.id === leagueId)?.en : STAT_BOARDS.find((b) => b.id === leagueId)?.ar}
      tools={
        <div className="space-y-3">
          <nav className="salon-tabs" aria-label={pick(locale, 'البطولة', 'Competition')}>
            {STAT_BOARDS.map((board) => (
              <Link
                key={board.id}
                href={href({ league: board.id })}
                className={`salon-tab${board.id === leagueId ? ' is-on' : ''}`}
              >
                {locale === 'en' ? board.en : board.ar}
              </Link>
            ))}
          </nav>
          <nav className="salon-tabs" aria-label={pick(locale, 'النوع', 'Kind')}>
            {kinds.map((item) => (
              <Link
                key={item.value}
                href={href({ kind: item.value })}
                className={`salon-tab${item.value === kind ? ' is-on' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      }
    >
      {desk.rows.length === 0 ? (
        <div className="salon-empty">
          <strong>{pick(locale, 'اللوحة فارغة', 'The board is empty')}</strong>
          <p>{pick(locale, 'المصدر ما رجّع لوحة لهذا الاختيار بعد.', 'The source has not returned a board for this selection yet.')}</p>
        </div>
      ) : (
        <div className={`stats-stage is-${kind}`}>
          {desk.rows.slice(0, 3).length > 0 ? (
            <Stagger className="stats-podium" delay={0.04}>
              {desk.rows.slice(0, 3).map((row) => {
                const name = localizePlainName(locale, row.name);
                const team = row.teamName ? localizePlainName(locale, row.teamName) : null;
                const inner = (
                  <>
                    <span className="stats-medal">{row.rank}</span>
                    {row.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.photoUrl} alt="" />
                    ) : (
                      <i>{name.charAt(0)}</i>
                    )}
                    <strong>{name}</strong>
                    {team ? (
                      <em>
                        {row.teamLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.teamLogo} alt="" className="stats-crest" />
                        ) : null}
                        {team}
                      </em>
                    ) : null}
                    <b>
                      {row.value}
                      <small>
                        {kind === 'goals'
                          ? pick(locale, 'هدف', 'goals')
                          : kind === 'assists'
                            ? pick(locale, 'صناعة', 'assists')
                            : pick(locale, 'بطاقة', 'cards')}
                      </small>
                    </b>
                  </>
                );
                return (
                  <StaggerItem key={`p-${row.rank}-${row.name}`}>
                    {row.slug ? <Link href={`/player/${row.slug}`}>{inner}</Link> : <div>{inner}</div>}
                  </StaggerItem>
                );
              })}
            </Stagger>
          ) : null}
          <ol className="stats-board">
            {desk.rows.slice(3).map((row) => {
              const name = localizePlainName(locale, row.name);
              const team = row.teamName ? localizePlainName(locale, row.teamName) : null;
              const max = desk.rows[0]?.value || 1;
              const body = (
                <>
                  <span className="stats-rank">{String(row.rank).padStart(2, '0')}</span>
                  {row.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.photoUrl} alt="" />
                  ) : (
                    <i>{name.charAt(0)}</i>
                  )}
                  <span className="stats-who">
                    <strong>{name}</strong>
                    {team ? (
                      <em>
                        {row.teamLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.teamLogo} alt="" className="stats-crest" />
                        ) : null}
                        {team}
                      </em>
                    ) : null}
                    <span className="stats-meter" aria-hidden>
                      <span style={{ width: `${Math.round((row.value / max) * 100)}%` }} />
                    </span>
                  </span>
                  <b>{row.value}</b>
                </>
              );
              return (
                <li key={`${row.rank}-${row.name}`}>
                  {row.slug ? (
                    <Link href={`/player/${row.slug}`} className="stats-row">
                      {body}
                    </Link>
                  ) : (
                    <div className="stats-row">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </SalonStage>
  );
}
