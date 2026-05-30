import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const SIZE = 1024;

export async function GET() {
  const img = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0052ff',
          color: 'white',
          fontFamily: 'sans-serif',
          gap: 48,
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 96,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 260,
            letterSpacing: '-0.06em',
          }}
        >
          S
        </div>
        <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Split
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
  img.headers.set(
    'Cache-Control',
    'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  );
  return img;
}
