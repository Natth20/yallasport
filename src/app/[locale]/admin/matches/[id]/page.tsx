import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { saveMatchMetadata, savePredictedLineup } from './actions';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

export default async function MatchIntelligenceAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      venue: true,
      referee: true,
      commentators: true,
      channels: { include: { channel: true } },
      lineups: { where: { isPredicted: true, source: 'EDITORIAL' } },
    },
  });
  if (!match) notFound();

  const lineupFor = (teamId: string) => match.lineups.find((lineup) => lineup.teamId === teamId);
  const playerJson = (teamId: string) => {
    const value = lineupFor(teamId)?.playersJson as { players?: unknown[] } | undefined;
    return JSON.stringify(value?.players ?? [], null, 2);
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{pick(locale, 'بيانات المباراة', 'Match data')}</span>
        <h1 className="mt-2 text-3xl font-bold">{match.homeTeam.name} {pick(locale, 'ضد', 'vs')} {match.awayTeam.name}</h1>
      </div>

      <form action={saveMatchMetadata.bind(null, match.id)} className="grid gap-5 rounded-2xl border border-border bg-card p-6 dark:border-border dark:bg-card/[0.04] md:grid-cols-2">
        <Field name="venue" label={pick(locale, 'الملعب', 'Venue')} defaultValue={match.venue?.name} />
        <Field name="referee" label={pick(locale, 'الحكم', 'Referee')} defaultValue={match.referee?.name} />
        <Field name="channel" label={pick(locale, 'القناة الناقلة', 'TV channel')} defaultValue={match.channels[0]?.channel.name} />
        <Field name="commentator" label={pick(locale, 'المعلّق', 'Commentator')} defaultValue={match.commentators[0]?.name} />
        <button className="rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-white hover:bg-orange-500 md:col-span-2">
          {pick(locale, 'حفظ بيانات البث والمباراة', 'Save match and broadcast data')}
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {[match.homeTeam, match.awayTeam].map((team) => (
          <form key={team.id} action={savePredictedLineup.bind(null, match.id, team.externalId)} className="space-y-5 rounded-2xl border border-border bg-card p-6 dark:border-border dark:bg-card/[0.04]">
            <div>
              <h2 className="text-lg font-bold">{pick(locale, 'التشكيلة المتوقعة', 'Predicted lineup')} — {team.name}</h2>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">{pick(locale, 'التعديل التحريري يتقدم على التوقع الآلي حتى إعلان الرسمية.', 'Editorial changes override automated predictions until the official lineup is announced.')}</p>
            </div>
            <Field name="formation" label={pick(locale, 'الخطة', 'Formation')} defaultValue={lineupFor(team.externalId)?.formation} placeholder="4-3-3" />
            <label className="block">
              <span className="mb-2 block text-xs font-bold">{pick(locale, 'اللاعبون بصيغة JSON', 'Players as JSON')}</span>
              <textarea
                name="players"
                rows={15}
                defaultValue={playerJson(team.externalId)}
                className="w-full rounded-xl border border-border bg-muted p-4 font-mono text-xs outline-none focus:border-orange-500/40 dark:border-border dark:bg-background"
              />
            </label>
            <button className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-orange-600">
              {pick(locale, 'حفظ التشكيلة المتوقعة', 'Save predicted lineup')}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

function Field({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string | null; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-border bg-muted px-4 text-sm outline-none focus:border-orange-500/40 dark:border-border dark:bg-background"
      />
    </label>
  );
}
