'use client';

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { base } from 'wagmi/chains';
import { namehash } from 'viem/ens';

/**
 * Basenames live on the Base L2 Resolver. OnchainKit's useAddress resolves
 * everything through Ethereum mainnet ENS via CCIP-Read, which has been
 * flaky from the browser (Cloudflare 522/526 on public RPCs). For .base.eth
 * we skip ENS entirely and query the L2 Resolver on Base mainnet directly —
 * one lightweight readContract, no gateways.
 *
 * Official resolver address from Coinbase's identity constants:
 * https://github.com/coinbase/onchainkit
 */
const BASE_L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;

const L2_RESOLVER_ABI = [
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
      const result = (await publicClient.readContract({
        address: BASE_L2_RESOLVER,
        abi: L2_RESOLVER_ABI,
        functionName: 'addr',
        args: [node],
      })) as `0x${string}`;
      return result === ZERO_ADDRESS ? null : result;
    },
  });
}
