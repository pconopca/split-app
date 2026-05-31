import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// base.dev spec: aspect ratio 1.91:1, max 1MB.
// 1200 / 1.91 ≈ 628.3 → 628 gives 1200/628 = 1.9108, well inside tolerance.
const WIDTH = 1200;
const HEIGHT = 628;

export async function GET() {
  const img = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: '#0052ff',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '56px 64px',
          gap: 48,
        }}
      >
        {/* Left column: brand + tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 440,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: 'rgba(255,255,255,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="56"
                height="56"
                viewBox="0 0 200 200"
                fill="none"
                stroke="white"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="100" y1="38" x2="100" y2="100" />
                <line x1="100" y1="100" x2="30" y2="170" />
                <line x1="100" y1="100" x2="170" y2="170" />
              </svg>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
              }}
            >
              Split bills.
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                color: '#9bb5ff',
                marginTop: -16,
              }}
            >
              Settle in seconds.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              opacity: 0.8,
              fontWeight: 500,
            }}
          >
            USDC on Base · no bank, no fees
          </div>
        </div>

        {/* Right column: split card mock */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
            borderRadius: 28,
            padding: 36,
            color: '#0a0e1a',
            gap: 18,
            boxShadow: '0 28px 80px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 14, color: '#71717a', fontWeight: 600 }}>
              SPLIT #3
            </div>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#0a0e1a' }}>
              Dinner at Coco
            </div>
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div
              style={{
                fontSize: 84,
                fontWeight: 800,
                color: '#0052ff',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              $20.00
            </div>
            <div style={{ fontSize: 18, color: '#71717a', display: 'flex' }}>per person</div>
          </div>

          {/* Status pill */}
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              background: '#fef3c7',
              color: '#92400e',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            2 / 3 PAID
          </div>

          {/* Participants */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              border: '1px solid #e4e4e7',
              borderRadius: 16,
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            <ParticipantRow
              color="#fb923c"
              name="alice.base.eth"
              paid
              borderTop={false}
            />
            <ParticipantRow color="#10b981" name="bob.base.eth" paid borderTop />
            <ParticipantRow color="#8b5cf6" name="dave.base.eth" paid={false} borderTop />
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
  img.headers.set(
    'Cache-Control',
    'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  );
  return img;
}

function ParticipantRow({
  color,
  name,
  paid,
  borderTop,
}: {
  color: string;
  name: string;
  paid: boolean;
  borderTop: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        gap: 12,
        borderTop: borderTop ? '1px solid #e4e4e7' : 'none',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: color,
            display: 'flex',
          }}
        />
        <div style={{ fontSize: 18, color: '#0a0e1a', display: 'flex' }}>{name}</div>
      </div>
      <div style={{ fontSize: 22, display: 'flex' }}>{paid ? '✅' : '⏳'}</div>
    </div>
  );
}
