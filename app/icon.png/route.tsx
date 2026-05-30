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
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0052ff',
          color: 'white',
          fontFamily: 'sans-serif',
          fontWeight: 800,
          fontSize: 720,
          letterSpacing: '-0.06em',
        }}
      >
        S
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
