import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';
import { ACTIVE_CHAIN, SPLIT_REGISTRY_ABI, SPLIT_REGISTRY_ADDRESS } from './contract';

const publicClient = createPublicClient({
  chain: ACTIVE_CHAIN,
  transport: http(),
});

export type SplitView = {
  creator: `0x${string}`;
  amountPerPerson: bigint;
  participants: readonly `0x${string}`[];
  paidCount: bigint;
};

export async function readSplit(splitId: bigint): Promise<SplitView | null> {
  try {
    const result = await publicClient.readContract({
      address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
      abi: SPLIT_REGISTRY_ABI,
      functionName: 'getSplit',
      args: [splitId],
    });
    const [creator, amountPerPerson, participants, paidCount] = result;
    if (creator === '0x0000000000000000000000000000000000000000') return null;
    return { creator, amountPerPerson, participants, paidCount };
  } catch {
    return null;
  }
}

export function chainExplorerTxUrl(txHash: `0x${string}`): string {
  return ACTIVE_CHAIN.id === base.id
    ? `https://basescan.org/tx/${txHash}`
    : ACTIVE_CHAIN.id === baseSepolia.id
      ? `https://sepolia.basescan.org/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`;
}
