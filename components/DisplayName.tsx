'use client';

import { useName } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import { shortAddress } from '@/lib/friends';

type Props = {
  address: `0x${string}`;
  className?: string;
};

/**
 * Renders the truncated 0x… address instantly, swaps in the Basename
 * once it resolves on Base mainnet. Avoids the blank flicker of
 * <Name> from OnchainKit while the resolver round-trip is in flight.
 */
export function DisplayName({ address, className }: Props) {
  const { data: name } = useName({ address, chain: base });
  return <span className={className}>{name ?? shortAddress(address)}</span>;
}
