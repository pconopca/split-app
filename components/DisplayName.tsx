'use client';

import { shortAddress, useFriends } from '@/lib/friends';
import { useAddressBasename } from '@/lib/basename';

type Props = {
  address: `0x${string}`;
  className?: string;
};

/**
 * Renders the user's display name with this priority:
 *   1. A friend nickname if the viewer has saved one for this address.
 *   2. The reverse Basename if registered (looked up on Base L2 directly).
 *   3. A truncated 0x… address as the instant fallback.
 *
 * Avoids the blank flicker of OnchainKit's <Name> while a resolver
 * round-trip is in flight.
 */
export function DisplayName({ address, className }: Props) {
  const { findByAddress } = useFriends();
  const friend = findByAddress(address);
  const { data: basename } = useAddressBasename(friend ? undefined : address);

  const label = friend?.nick ?? basename ?? shortAddress(address);
  return <span className={className}>{label}</span>;
}
