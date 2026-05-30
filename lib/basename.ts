'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { base } from 'wagmi/chains';
import { encodePacked, keccak256 } from 'viem';
import { namehash } from 'viem/ens';

/**
 * Basenames live on a Base-native ENS registry. Each name can declare its
 * own resolver contract (not always the default L2 Resolver) — so we have
 * to do a two-step lookup:
 *   1. Ask the registry which resolver this name uses.
 *   2. Ask that resolver for the address.
 *
 * This bypasses Ethereum mainnet ENS + CCIP-Read entirely, which has been
 * unreliable from the browser (Cloudflare 522/526 on public mainnet RPCs).
 */
const BASE_REGISTRY = '0xB94704422c2a1E396835A571837Aa5AE53285a95' as const;

const REGISTRY_ABI = [
  {
    type: 'function',
    name: 'resolver',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

const RESOLVER_ABI = [
  {
    type: 'function',
    name: 'addr',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function isBasename(name: string): boolean {
  return name.toLowerCase().endsWith('.base.eth');
}

export function useBasenameAddress(name: string | undefined) {
  const publicClient = usePublicClient({ chainId: base.id });
  return useQuery({
    queryKey: ['basename-address', name?.toLowerCase()],
    enabled: !!name && !!publicClient && isBasename(name),
    staleTime: 60_000,
    queryFn: async () => {
      if (!name || !publicClient) return null;
      const node = namehash(name);

      const resolver = (await publicClient.readContract({
        address: BASE_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: 'resolver',
        args: [node],
      })) as `0x${string}`;
      if (!resolver || resolver === ZERO_ADDRESS) return null;

      try {
        const addr = (await publicClient.readContract({
          address: resolver,
          abi: RESOLVER_ABI,
          functionName: 'addr',
          args: [node],
        })) as `0x${string}`;
        return addr === ZERO_ADDRESS ? null : addr;
      } catch {
        // Resolver might not implement addr(bytes32) (e.g. it expects
        // addr(bytes32,uint256) for multi-chain). Treat as unresolvable.
        return null;
      }
    },
  });
}

const NAME_RESOLVER_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

// Pre-computed namehash of "80002105.reverse" (Base mainnet coinType reverse parent).
const BASE_REVERSE_PARENT_NODE =
  '0x08d9b0993eb8c4da57c37a4b84a6e384c2623114ff4e9370ed51c9b8935109ba' as const;

function reverseNodeFor(address: `0x${string}`): `0x${string}` {
  const stripped = address.slice(2).toLowerCase();
  const addrNode = keccak256(`0x${stripped}` as `0x${string}`);
  return keccak256(
    encodePacked(['bytes32', 'bytes32'], [BASE_REVERSE_PARENT_NODE, addrNode]),
  );
}

/**
 * Reverse lookup: address → Basename. Uses the same two-step pattern as the
 * forward lookup (registry.resolver(node), then resolver.name(node)) so it
 * survives custom resolvers.
 */
export function useAddressBasename(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient({ chainId: base.id });
  return useQuery({
    queryKey: ['basename-name', address?.toLowerCase()],
    enabled: !!address && !!publicClient,
    staleTime: 60_000,
    queryFn: async () => {
      if (!address || !publicClient) return null;
      const reverseNode = reverseNodeFor(address);

      const resolver = (await publicClient.readContract({
        address: BASE_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: 'resolver',
        args: [reverseNode],
      })) as `0x${string}`;
      if (!resolver || resolver === ZERO_ADDRESS) return null;

      try {
        const name = (await publicClient.readContract({
          address: resolver,
          abi: NAME_RESOLVER_ABI,
          functionName: 'name',
          args: [reverseNode],
        })) as string;
        return name && name.length > 0 ? name : null;
      } catch {
        return null;
      }
    },
  });
}
