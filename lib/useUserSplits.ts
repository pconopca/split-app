'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import {
  SPLIT_REGISTRY_ABI,
  SPLIT_REGISTRY_ADDRESS,
  SPLIT_REGISTRY_DEPLOY_BLOCK,
  ACTIVE_CHAIN,
} from './contract';

// Base Sepolia public RPC limits getLogs to 2000 blocks per request.
const MAX_BLOCK_RANGE = 2_000n;

export type UserSplit = {
  id: bigint;
  creator: `0x${string}`;
  amountPerPerson: bigint;
  participants: readonly `0x${string}`[];
  paidCount: bigint;
  memo: string;
  createdBlock: bigint;
  /**
   * 'creator' = user created this split.
   * 'participant' = user is one of the payers.
   * 'both' = user created AND is a participant.
   */
  role: 'creator' | 'participant' | 'both';
};

const SPLIT_CREATED_EVENT = parseAbiItem(
  'event SplitCreated(uint256 indexed splitId, address indexed creator, uint256 amountPerPerson, address[] participants, string memo)',
);

export function useUserSplits(userAddress: `0x${string}` | undefined) {
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const [splits, setSplits] = useState<UserSplit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || !publicClient) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        if (!publicClient || !userAddress) return;

        // Public RPCs reject 'earliest' on long-lived chains, so scan
        // from the contract's known deployment block in fixed-size chunks.
        const fromBlock = SPLIT_REGISTRY_DEPLOY_BLOCK[ACTIVE_CHAIN.id] ?? 0n;
        const toBlock = await publicClient.getBlockNumber();
        const ranges: { from: bigint; to: bigint }[] = [];
        let cursor = fromBlock;
        while (cursor <= toBlock) {
          const end =
            cursor + MAX_BLOCK_RANGE - 1n > toBlock ? toBlock : cursor + MAX_BLOCK_RANGE - 1n;
          ranges.push({ from: cursor, to: end });
          cursor = end + 1n;
        }
        const chunks = await Promise.all(
          ranges.map((r) =>
            publicClient.getLogs({
              address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
              event: SPLIT_CREATED_EVENT,
              fromBlock: r.from,
              toBlock: r.to,
            }),
          ),
        );
        const logs = chunks.flat();

        const lowerUser = userAddress.toLowerCase();

        // Pre-filter to splits where user is creator OR participant.
        const candidates = logs
          .map((log) => {
            const { args, blockNumber } = log;
            return {
              splitId: args.splitId!,
              creator: args.creator!,
              amountPerPerson: args.amountPerPerson!,
              participants: args.participants ?? [],
              createdBlock: blockNumber,
            };
          })
          .filter((s) => {
            const isCreator = s.creator.toLowerCase() === lowerUser;
            const isParticipant = s.participants.some(
              (p) => p.toLowerCase() === lowerUser,
            );
            return isCreator || isParticipant;
          });

        // Fetch current paidCount for each candidate.
        const enriched: UserSplit[] = await Promise.all(
          candidates.map(async (c) => {
            const [, , participants, paidCount, memo] = await publicClient.readContract({
              address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
              abi: SPLIT_REGISTRY_ABI,
              functionName: 'getSplit',
              args: [c.splitId],
            });
            const isCreator = c.creator.toLowerCase() === lowerUser;
            const isParticipant = participants.some(
              (p) => p.toLowerCase() === lowerUser,
            );
            const role: UserSplit['role'] =
              isCreator && isParticipant
                ? 'both'
                : isCreator
                  ? 'creator'
                  : 'participant';
            return {
              id: c.splitId,
              creator: c.creator,
              amountPerPerson: c.amountPerPerson,
              participants,
              paidCount,
              memo,
              createdBlock: c.createdBlock,
              role,
            };
          }),
        );

        // Sort newest first.
        enriched.sort((a, b) => (b.createdBlock > a.createdBlock ? 1 : -1));

        if (!cancelled) setSplits(enriched);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userAddress, publicClient]);

  return { splits, isLoading, error };
}
