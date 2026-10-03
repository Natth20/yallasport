'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { pick } from '@/i18n/pick';
import hall from '@/components/salon/entity-hall.module.css';
import board from './matches-hall.module.css';

export type MatchdayReelItem = {
  id: string;
  status: string;
  minute?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  kickoffAt: string;
  venue?: string;
  venueCity?: string;
  round?: string;
  homeFormation?: string;
  awayFormation?: string;
  homeCoach?: string;
  awayCoach?: string;
  hasLicensedStream?: boolean;
  channels: Array<{ name: string }>;
  homeTeam: { name: string; slug: string; logoUrl?: string | null };
  awayTeam: { name: string; slug: string; logoUrl?: string | null };
  league: { name: string; slug: string };
};

function folio(index: number) {
  return String(index + 1).padStart(2, '0');
}

function isLive(status: string) {
  return status === 'LIVE' || status === 'HALFTIME';
}

function statusWord(item: MatchdayReelItem, locale: string) {
  if (item.status === 'HALFTIME') return pick(locale, 'استراحة', 'HT');
  if (item.status === 'LIVE') {
    return item.minute ? `${pick(locale, 'مباشر', 'LIVE')} ${item.minute}′` : pick(locale, 'مباشر', 'LIVE');
  }
  if (item.status === 'FINISHED') return pick(locale, 'نهاية', 'FT');
  if (item.status === 'POSTPONED') return pick(locale, 'مؤجلة', 'Postponed');
  if (item.status === 'CANCELLED') return pick(locale, 'ملغاة', 'Cancelled');
  return pick(locale, 'لم تبدأ', 'NS');
}

export function MatchdayConsole({
  locale,
  items,
  dateLabel,
}: {
  locale: string;
  items: MatchdayReelItem[];
  dateLabel: string;
}) {
  const reel = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 12);
  }, [items]);

  const [activeId, setActiveId] = useState(reel[0]?.id ?? '');
  const current = reel.find((item) => item.id === activeId) ?? reel[0];
  const currentIndex = Math.max(0, reel.findIndex((item) => item.id === current?.id));

  if (!current) return null;

  const scored = current.homeScore != null && current.awayScore != null;
  const live = isLive(current.status);

  const step = (dir: -1 | 1) => {
    if (reel.length < 2) return;
    const next = (currentIndex + dir + reel.length) % reel.length;
    setActiveId(reel[next].id);
  };

  return (
    <div id="hall-screen" className={`${hall.wideScreen} ${hall.stadiumHall} ${board.daySalon}`}>
      <div className={hall.chassis}>
        <HallBezel
          label={pick(locale, 'مباريات اليوم', "Today's matches")}
          clock={`${folio(currentIndex)} / ${folio(reel.length - 1)}`}
        />
        <div className={`${hall.frame} ${board.dayFrame}`}>
          <div className={hall.crestWash} aria-hidden>
            {current.homeTeam.logoUrl ? <img src={current.homeTeam.logoUrl} alt="" /> : <span />}
            {current.awayTeam.logoUrl ? <img src={current.awayTeam.logoUrl} alt="" /> : <span />}
          </div>
          <div className={hall.duel}>
            <Link href={`/team/${current.homeTeam.slug}`} className={hall.side}>
              <LeagueCrest name={current.homeTeam.name} logoUrl={current.homeTeam.logoUrl} className="h-24 w-24" />
              <strong>{current.homeTeam.name}</strong>
              {current.homeFormation ? <span>{current.homeFormation}</span> : null}
            </Link>
            <div className={hall.score}>
              <em className={live ? hall.liveBadge : undefined}>
                {live ? <span className={hall.liveDot} aria-hidden /> : null}
                {statusWord(current, locale)}
              </em>
              <b>{scored ? `${current.homeScore} — ${current.awayScore}` : 'VS'}</b>
            </div>
            <Link href={`/team/${current.awayTeam.slug}`} className={hall.side}>
              <LeagueCrest name={current.awayTeam.name} logoUrl={current.awayTeam.logoUrl} className="h-24 w-24" />
              <strong>{current.awayTeam.name}</strong>
              {current.awayFormation ? <span>{current.awayFormation}</span> : null}
            </Link>
          </div>
          <div className={hall.caption}>
            <span>
              <b>{current.league.name}</b>
              {current.round ? ` · ${current.round}` : ''}
              {current.venue ? ` · ${current.venue}` : ''}
            </span>
            {current.status === 'NOT_STARTED' ? (
              <ClientTime value={current.kickoffAt} />
            ) : (
              <span>{statusWord(current, locale)}</span>
            )}
          </div>
          <span className={hall.meter} key={current.id} />
          {reel.length > 1 ? (
            <>
              <button
                type="button"
                className={`${hall.step} ${hall.prev}`}
                onClick={() => step(-1)}
                aria-label={pick(locale, 'السابق', 'Previous')}
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                className={`${hall.step} ${hall.next}`}
                onClick={() => step(1)}
                aria-label={pick(locale, 'التالي', 'Next')}
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : null}
          <HallBrackets />
        </div>
      </div>

      <aside className={board.pitchStrip} aria-label={pick(locale, 'مباريات مختارة', 'Selected fixtures')}>
        <header className={board.pitchStripHead}>
          <div>
            <p>{pick(locale, 'مباريات مختارة', 'Selected fixtures')}</p>
            <h3>{pick(locale, 'مباريات مختارة', 'Selected fixtures')}</h3>
          </div>
          <span>{folio(reel.length - 1)}</span>
        </header>
        <ol className={board.pitchStripList}>
          {reel.map((item, index) => {
            const on = item.id === current.id;
            const itemScored = item.homeScore != null && item.awayScore != null;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${board.pitchCard}${on ? ` ${board.pitchCardOn}` : ''}`}
                  onClick={() => setActiveId(item.id)}
                  aria-pressed={on}
                >
                  <span className={board.pitchNum}>{folio(index)}</span>
                  <LeagueCrest name={item.homeTeam.name} logoUrl={item.homeTeam.logoUrl} className="h-8 w-8" />
                  <span className={board.pitchCopy}>
                    <b>
                      {item.homeTeam.name} — {item.awayTeam.name}
                    </b>
                    <i>
                      {itemScored
                        ? `${item.homeScore}–${item.awayScore} · ${statusWord(item, locale)}`
                        : item.status === 'NOT_STARTED'
                          ? item.league.name
                          : statusWord(item, locale)}
                    </i>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className={hall.program}>
        <div className={hall.chips}>
          <span className={hall.chipOn}>{dateLabel}</span>
          <Link href={`/league/${current.league.slug}`} className={hall.chip}>
            {current.league.name}
          </Link>
          {current.hasLicensedStream ? (
            <span className={hall.chip}>
              <Radio size={12} aria-hidden />
              {pick(locale, 'نقل مرخّص', 'Licensed feed')}
            </span>
          ) : null}
          {current.channels[0] ? <span className={hall.chip}>{current.channels[0].name}</span> : null}
        </div>
        <h2 className={hall.programTitle}>
          {current.homeTeam.name} — {current.awayTeam.name}
        </h2>
        <div className={hall.acts}>
          <Link href={`/match/${current.id}`} className={hall.go}>
            <span>{pick(locale, 'افتح مركز المباراة', 'Open match center')}</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link href={`/league/${current.league.slug}`} className={hall.ghost}>
            {pick(locale, 'البطولة', 'Competition')}
          </Link>
        </div>
      </div>
    </div>
  );
}
