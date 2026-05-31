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
          background: '#0052ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="680"
          height="680"
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
    ),
    { width: SIZE, height: SIZE },
  );
  img.headers.set(
    'Cache-Control',
    'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  );
  return img;
}
