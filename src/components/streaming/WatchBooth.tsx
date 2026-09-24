import { BrandMark } from '@/components/brand/BrandMark';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { MatchStreamPlayer } from '@/components/streaming/MatchStreamPlayer';
import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

type TeamBit = { id: string; name: string; logoUrl: string | null };

type BoothAsset = {
  id: string;
  status: string;
  channel: { name: string } | null;
  episode: { title: string | null; show: { title: string } } | null;
  match: {
    id: string;
    homeTeam: TeamBit;
    awayTeam: TeamBit;
    league: { name: string } | null;
    statistics: {
      id: string;
      teamId: string;
      possession: number | null;
      shotsOnTarget: number | null;
      shotsOffTarget: number | null;
    }[];
    channels: { id: string; channel: { name: string } }[];
  } | null;
};

type UpcomingBit = {
  id: string;
  startsAt: Date | null;
  channel: { name: string } | null;
  match: { homeTeam: { name: string; logoUrl: string | null }; awayTeam: { name: string; logoUrl: string | null } } | null;
};

export async function WatchBooth({
  locale,
  entitled,
  geoBlocked,
  asset,
  siblingChannels,
  upcoming,
  related,
}: {
  locale: string;
  entitled: boolean;
  geoBlocked?: boolean;
  asset: BoothAsset | null;
  siblingChannels: { id: string; channel: { name: string } | null }[];
  upcoming: UpcomingBit[];
  related: { id: string; slug: string; title: string }[];
}) {
  const t = await getTranslations('watch');
  const headline = asset?.match
    ? `${asset.match.homeTeam.name} vs ${asset.match.awayTeam.name}`
    : asset?.episode?.show.title || asset?.channel?.name || t('booth');
  const live = asset?.status === 'LIVE';

  return (
    <div className="watch-booth watch-booth-lux relative min-h-screen pb-20">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />
      <span className="watch-corner is-bl" aria-hidden />
      <span className="watch-corner is-br" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6">
        <header className="watch-marquee watch-marquee-lux">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size={36} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">{t('kicker')}</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-foreground dark:text-foreground sm:text-3xl">{headline}</h1>
              <p className="mt-1 text-[12px] font-semibold text-muted-foreground dark:text-foreground/55">{t('booth')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/live" className="watch-chip-link">
              {t('back_live')}
            </Link>
            {live ? (
              <span className="watch-live-pill">
                <i />
                {t('on_air')}
              </span>
            ) : null}
          </div>
        </header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_19.5rem]">
          <div>
            <div className="watch-gate watch-gate-lux">
              <div className="watch-gate-screen">
                {geoBlocked ? (
                  <div className="relative flex aspect-video items-center justify-center">
                    <PitchWatermark className="pointer-events-none absolute h-40 w-auto text-white/10" />
                    <div className="relative max-w-md px-6 text-center">
                      <h1 className="text-2xl font-black">{t('geo')}</h1>
                      <p className="mt-3 text-sm leading-7 text-white/55">{t('geo_copy')}</p>
                    </div>
                  </div>
                ) : !asset ? (
                  <div className="relative flex aspect-video items-center justify-center">
                    <span className="broadcast-snow" />
                    <PitchWatermark className="pointer-events-none absolute h-44 w-auto text-white/10" />
                    <div className="relative max-w-md px-6 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">{t('booth')}</p>
                      <p className="mt-3 text-2xl font-black text-white sm:text-3xl">{t('house_empty')}</p>
                    </div>
                  </div>
                ) : entitled ? (
                  <MatchStreamPlayer assetId={asset.id} />
                ) : (
                  <div className="relative flex aspect-video items-center justify-center">
                    <PitchWatermark className="pointer-events-none absolute h-40 w-auto text-white/10" />
                    <p className="relative px-6 text-center text-lg font-black">{t('entitlement')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="watch-plaque watch-plaque-lux">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">{t('current_feed')}</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{headline}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-white/50">
                {asset?.match?.league?.name ? <span>{asset.match.league.name}</span> : null}
                {asset?.channel?.name ? <span>· {asset.channel.name}</span> : null}
                {asset?.episode?.title ? <span>· {asset.episode.title}</span> : null}
              </div>
              {asset?.match ? (
                <div className="mt-5 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  <div className="flex items-center gap-3">
                    <img src={asset.match.homeTeam.logoUrl || '/placeholder-team.png'} alt="" className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
                    <strong className="truncate text-sm font-black sm:text-lg">{asset.match.homeTeam.name}</strong>
                  </div>
                  <span className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                    {locale === 'ar' ? 'ضد' : 'vs'}
                  </span>
                  <div className="flex items-center gap-3">
                    <img src={asset.match.awayTeam.logoUrl || '/placeholder-team.png'} alt="" className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
                    <strong className="truncate text-sm font-black sm:text-lg">{asset.match.awayTeam.name}</strong>
                  </div>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {asset?.match ? (
                  <Link
                    href={`/match/${asset.match.id}`}
                    className="rounded-xl bg-primary px-4 py-2 text-[11px] font-black text-white hover:bg-orange-500"
                  >
                    {t('match_center')}
                  </Link>
                ) : null}
                {siblingChannels.map((item) => (
                  <Link
                    key={item.id}
                    href={`/watch/${item.id}`}
                    className="rounded-xl border border-white/15 px-4 py-2 text-[11px] font-bold text-white/70 hover:border-primary hover:text-white"
                  >
                    {item.channel?.name || t('title')}
                  </Link>
                ))}
              </div>
            </div>

            {asset?.match?.statistics?.length ? (
              <section className="mt-8">
                <h2 className="mb-4 text-lg font-black">{t('stats')}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {asset.match.statistics.map((row) => {
                    const team =
                      row.teamId === asset.match?.homeTeam.id
                        ? asset.match.homeTeam
                        : row.teamId === asset.match?.awayTeam.id
                          ? asset.match.awayTeam
                          : null;
                    const poss = typeof row.possession === 'number' ? Math.min(100, Math.max(0, row.possession)) : null;
                    return (
                      <div key={row.id} className="rounded-2xl border border-white/10 bg-card/[0.03] p-4">
                        <p className="text-[11px] font-bold text-white/70">{team?.name || '—'}</p>
                        {poss != null ? (
                          <>
                            <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-white/35">{t('possession')}</p>
                            <p className="mt-1 text-2xl font-black tabular-nums text-primary">{poss}%</p>
                            <div className="watch-meter mt-2">
                              <span style={{ width: `${poss}%` }} />
                            </div>
                          </>
                        ) : null}
                        <p className="mt-3 text-[12px] text-white/45">
                          {t('shots_on')} {row.shotsOnTarget ?? '—'} · {t('shots_off')} {row.shotsOffTarget ?? '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {asset?.match?.channels?.length ? (
              <section className="mt-8">
                <h2 className="mb-3 text-lg font-black">{t('licensed_channels')}</h2>
                <ul className="flex flex-wrap gap-2">
                  {asset.match.channels.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/60"
                    >
                      {row.channel.name}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-8">
            {upcoming.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-black">{t('next_up')}</h2>
                <ul className="space-y-3">
                  {upcoming.map((item) => (
                    <li key={item.id}>
                      <Link href={`/watch/${item.id}`} className="watch-ticket block px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">
                          {item.channel?.name || t('title')}
                        </p>
                        <p className="mt-1 text-sm font-black leading-6">
                          {item.match
                            ? `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`
                            : item.channel?.name}
                        </p>
                        {item.startsAt ? (
                          <ClientTime value={item.startsAt} className="mt-1 block text-[11px] text-foreground/45" />
                        ) : null}
                        <TicketBarcode className="mt-3 text-foreground/50" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {related.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-black">{t('related_news')}</h2>
                <ul className="space-y-2">
                  {related.map((item) => (
                    <li key={item.id}>
                      <Link href={`/news/${item.slug}`} className="watch-clipping block px-4 py-3 text-sm font-bold leading-6 text-white/80 hover:text-primary">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
