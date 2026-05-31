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
import {
  type CachedCandidate,
  type SplitsCache,
  mergeCandidates,
  readCache,
  writeCache,
} from './splitsCache';

// Base Sepolia public RPC limits getLogs to 2000 blocks per request.
const MAX_BLOCK_RANGE = 2_000n;

export type UserSplit = {
  id: bigint;
  creator: `0x${string}`;
  amountPerPerson: bigint;
  participants: readonly `0x${string}`[];
  paidCount: bigint;
  memo: string;
  cancelled: boolean;
  createdBlock: bigint;
  /**
   * 'creator' = user created this split.
   * 'participant' = user is one of the payers.
   * 'both' = user created AND is a participant.
   */
  role: 'creator' | 'participant' | 'both';
  /** Whether the connected user has paid their share on this split. */
  hasPaidByUser: boolean;
};

const SPLIT_CREATED_EVENT = parseAbiItem(
  'event SplitCreated(uint256 indexed splitId, address indexed creator, uint256 amountPerPerson, address[] participants, string memo)',
);

type Candidate = {
  splitId: bigint;
  creator: `0x${string}`;
  amountPerPerson: bigint;
  participants: readonly `0x${string}`[];
  memo: string;
  createdBlock: bigint;
};

function candidateFromCache(c: CachedCandidate): Candidate {
  return {
    splitId: BigInt(c.splitId),
    creator: c.creator,
    amountPerPerson: BigInt(c.amountPerPerson),
    participants: c.participants,
    memo: c.memo,
    createdBlock: BigInt(c.createdBlock),
  };
}

function candidateToCache(c: Candidate): CachedCandidate {
  return {
    splitId: c.splitId.toString(),
    creator: c.creator,
    amountPerPerson: c.amountPerPerson.toString(),
    participants: [...c.participants],
    memo: c.memo,
    createdBlock: c.createdBlock.toString(),
  };
}

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

        const lowerUser = userAddress.toLowerCase();
        const deployBlock = SPLIT_REGISTRY_DEPLOY_BLOCK[ACTIVE_CHAIN.id] ?? 0n;

        // Load cached candidates from prior runs (always read fresh).
        const cached = readCache(ACTIVE_CHAIN.id, userAddress);
        const cachedCandidates: Candidate[] = cached
          ? cached.candidates.map(candidateFromCache)
          : [];
        const cachedLastBlock = cached ? BigInt(cached.lastScannedBlock) : deployBlock - 1n;
        const fromBlock = cachedLastBlock + 1n > deployBlock ? cachedLastBlock + 1n : deployBlock;
        const toBlock = await publicClient.getBlockNumber();

        // Scan only the delta since the last visit, in fixed-size chunks.
        let newCandidates: Candidate[] = [];
        if (fromBlock <= toBlock) {
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
          newCandidates = chunks
            .flat()
            .map((log) => ({
              splitId: log.args.splitId!,
              creator: log.args.creator!,
              amountPerPerson: log.args.amountPerPerson!,
              participants: log.args.participants ?? [],
              memo: log.args.memo ?? '',
              createdBlock: log.blockNumber,
            }))
            .filter((c) => {
              const isCreator = c.creator.toLowerCase() === lowerUser;
              const isParticipant = c.participants.some(
                (p) => p.toLowerCase() === lowerUser,
              );
              return isCreator || isParticipant;
            });
        }

        // Merge: existing cache + delta. Dedup by split id.
        const allCandidatesById = new Map<string, Candidate>();
        for (const c of cachedCandidates) allCandidatesById.set(c.splitId.toString(), c);
        for (const c of newCandidates) allCandidatesById.set(c.splitId.toString(), c);
        const allCandidates = Array.from(allCandidatesById.values());

        // Always re-fetch the current state for every known candidate.
        const enriched: UserSplit[] = await Promise.all(
          allCandidates.map(async (c) => {
            const [splitTuple, hasPaidByUser] = await Promise.all([
              publicClient.readContract({
                address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
                abi: SPLIT_REGISTRY_ABI,
                functionName: 'getSplit',
                args: [c.splitId],
              }),
              publicClient.readContract({
                address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
                abi: SPLIT_REGISTRY_ABI,
                functionName: 'hasPaid',
                args: [c.splitId, userAddress],
              }),
            ]);
            const [, , participants, paidCount, memo, cancelled] = splitTuple;
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
              cancelled,
              createdBlock: c.createdBlock,
              role,
              hasPaidByUser,
            };
          }),
        );

        // Sort newest first.
        enriched.sort((a, b) => (b.createdBlock > a.createdBlock ? 1 : -1));

        // Persist the merged candidate set + new high-water mark.
        const next: SplitsCache = {
          lastScannedBlock: toBlock.toString(),
          candidates: mergeCandidates(
            cached?.candidates ?? [],
            newCandidates.map(candidateToCache),
          ),
        };
        writeCache(ACTIVE_CHAIN.id, userAddress, next);

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
