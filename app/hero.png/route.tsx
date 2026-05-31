import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET() {
  const img = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: 'linear-gradient(135deg, #0052ff 0%, #001a52 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: 72,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 28,
              opacity: 0.85,
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="36"
                height="36"
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
            <span>Split · onchain on Base</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
            }}
          >
            Split bills.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: '#9bb5ff',
            }}
          >
            Settle in seconds.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              opacity: 0.8,
              marginTop: 16,
              fontWeight: 500,
            }}
          >
            Pay your share in USDC — without leaving the feed.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255,255,255,0.10)',
            borderRadius: 32,
            padding: '48px 56px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 22, opacity: 0.7, fontWeight: 500 }}>
            EACH PAYS
          </div>
          <div style={{ display: 'flex', fontSize: 144, fontWeight: 800, letterSpacing: '-0.06em' }}>
            $20
          </div>
          <div style={{ display: 'flex', fontSize: 20, opacity: 0.6 }}>
            USDC
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
