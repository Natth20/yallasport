import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const match = await prisma.match.findFirst({
      where: { OR: [{ id }, { externalId: id }] },
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        status: true,
        minute: true,
        kickoffAt: true,
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
        league: { select: { name: true, logoUrl: true } },
      },
    });

    if (!match) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: 48,
              fontWeight: 900,
            }}
          >
            <span>يلا سبورت | Yalla Sport</span>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
    const isFinished = match.status === 'FINISHED';
    const hasScore = match.homeScore != null && match.awayScore != null;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 64px',
            backgroundColor: '#0a0f1d',
            backgroundImage: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0a0f1d 80%)',
            color: '#ffffff',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  color: '#fbbf24',
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                <span>{match.league.name}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#f97316' }}>يلا</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#ffffff' }}>سبورت</span>
            </div>
          </div>

          {/* Teams and Score Arena */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              margin: '32px 0',
            }}
          >
            {/* Home Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '38%',
              }}
            >
              {match.homeTeam.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.homeTeam.logoUrl}
                  alt=""
                  width={140}
                  height={140}
                  style={{ objectFit: 'contain', marginBottom: 16 }}
                />
              ) : null}
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  textAlign: 'center',
                  color: '#ffffff',
                }}
              >
                {match.homeTeam.name}
              </span>
            </div>

            {/* Score / Center */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '24%',
              }}
            >
              {hasScore ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: 80,
                    fontWeight: 900,
                    color: isLive ? '#22c55e' : '#ffffff',
                    letterSpacing: '4px',
                  }}
                >
                  <span>{match.homeScore}</span>
                  <span style={{ color: '#64748b' }}>:</span>
                  <span>{match.awayScore}</span>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 54,
                    fontWeight: 900,
                    color: '#f59e0b',
                    letterSpacing: '2px',
                  }}
                >
                  <span>VS</span>
                </div>
              )}

              <div
                style={{
                  marginTop: 12,
                  padding: '6px 24px',
                  borderRadius: '999px',
                  fontSize: 20,
                  fontWeight: 800,
                  backgroundColor: isLive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  color: isLive ? '#ef4444' : '#94a3b8',
                  border: isLive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(100, 116, 139, 0.3)',
                }}
              >
                <span>
                  {isLive
                    ? `${match.minute ? `${match.minute}′ ` : ''}مباشر LIVE`
                    : isFinished
                      ? 'نهاية اللقاء FT'
                      : new Date(match.kickoffAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                </span>
              </div>
            </div>

            {/* Away Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '38%',
              }}
            >
              {match.awayTeam.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.awayTeam.logoUrl}
                  alt=""
                  width={140}
                  height={140}
                  style={{ objectFit: 'contain', marginBottom: 16 }}
                />
              ) : null}
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  textAlign: 'center',
                  color: '#ffffff',
                }}
              >
                {match.awayTeam.name}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              fontSize: 18,
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            <span>يلا سبورت · التغطية اللحظية للمباريات والنتائج المباشرة</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0f1d',
            color: '#ffffff',
            fontSize: 48,
            fontWeight: 900,
          }}
        >
          <span>يلا سبورت | Yalla Sport</span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
