import { ImageResponse } from 'next/og';
import { readSplit } from '@/lib/onchain';
import { formatUSDC } from '@/lib/usdc';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 800 };

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  let split = null;
  try {
    split = await readSplit(BigInt(id));
  } catch {
    /* invalid id */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0052ff 0%, #1a1a2e 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 36, opacity: 0.7, marginBottom: 20, display: 'flex' }}>
          Split #{id}
        </div>
        {split ? (
          <>
            {split.memo && (
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 600,
                  marginBottom: 24,
                  display: 'flex',
                  textAlign: 'center',
                  maxWidth: 1000,
                }}
              >
                {split.memo}
              </div>
            )}
            <div style={{ fontSize: 160, fontWeight: 800, lineHeight: 1, display: 'flex' }}>
              ${formatUSDC(split.amountPerPerson)}
            </div>
            <div style={{ fontSize: 36, opacity: 0.7, marginTop: 20, display: 'flex' }}>
              per person · USDC on Base
            </div>
            <div style={{ fontSize: 32, marginTop: 40, display: 'flex' }}>
              {split.paidCount.toString()} / {split.participants.length} paid
            </div>
          </>
        ) : (
          <div style={{ fontSize: 48, opacity: 0.7, display: 'flex' }}>Split not found</div>
        )}
      </div>
    ),
    SIZE,
  );
}
