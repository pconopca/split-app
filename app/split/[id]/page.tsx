import type { Metadata } from 'next';
import SplitClient from './SplitClient';
import { readSplit } from '@/lib/onchain';
import { getBaseUrl } from '@/lib/baseUrl';
import { formatUSDC } from '@/lib/usdc';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = getBaseUrl();
  const splitUrl = `${baseUrl}/split/${id}`;

  let bigId: bigint | null = null;
  try {
    bigId = BigInt(id);
  } catch {
    /* ignore */
  }
  const split = bigId !== null ? await readSplit(bigId) : null;

  const memoSegment = split?.memo ? `${split.memo} · ` : '';
  const title = split
    ? `${memoSegment}Pay $${formatUSDC(split.amountPerPerson)} · Split #${id}`
    : `Split #${id}`;
  const description = split
    ? `${memoSegment}${split.paidCount}/${split.participants.length} paid · USDC on Base`
    : 'Split bills in USDC on Base.';
  const imageUrl = `${baseUrl}/api/og/split/${id}`;

  const embed = {
    version: '1',
    imageUrl,
    button: {
      title: split ? `Pay $${formatUSDC(split.amountPerPerson)}` : 'Open split',
      action: {
        type: 'launch_miniapp',
        name: 'Split',
        url: splitUrl,
      },
    },
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      url: splitUrl,
    },
    other: {
      'fc:miniapp': JSON.stringify(embed),
      'fc:frame': JSON.stringify(embed),
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <SplitClient idParam={id} />;
}
