'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { SPLIT_REGISTRY_ABI, SPLIT_REGISTRY_ADDRESS, ACTIVE_CHAIN } from './contract';

export type UserSplit = {
  id: bigint;
  creator: `0x${string}`;
  amountPerPerson: bigint;
  participants: readonly `0x${string}`[];
  paidCount: bigint;
  createdBlock: bigint;
  /**
   * 'creator' = user created this split.
   * 'participant' = user is one of the payers.
   * 'both' = user created AND is a participant.
   */
  role: 'creator' | 'participant' | 'both';
};

const SPLIT_CREATED_EVENT = parseAbiItem(
  'event SplitCreated(uint256 indexed splitId, address indexed creator, uint256 amountPerPerson, address[] participants)',
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

        // Read all SplitCreated events from the contract.
        // For an MVP this scans from the contract's deployment block (recent).
        // A production app would use a subgraph or persist last-seen block.
        const logs = await publicClient.getLogs({
          address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
          event: SPLIT_CREATED_EVENT,
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

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
            const [, , participants, paidCount] = await publicClient.readContract({
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
