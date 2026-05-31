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
  memo: string;
  cancelled: boolean;
};

export async function readSplit(splitId: bigint): Promise<SplitView | null> {
  try {
    const result = await publicClient.readContract({
      address: SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id],
      abi: SPLIT_REGISTRY_ABI,
      functionName: 'getSplit',
      args: [splitId],
    });
    const [creator, amountPerPerson, participants, paidCount, memo, cancelled] = result;
    if (creator === '0x0000000000000000000000000000000000000000') return null;
    return { creator, amountPerPerson, participants, paidCount, memo, cancelled };
  } catch {
    return null;
  }
}

export function chainExplorerTxUrl(txHash: `0x${string}`): string {
  const id: number = ACTIVE_CHAIN.id;
  if (id === base.id) return `https://basescan.org/tx/${txHash}`;
  if (id === baseSepolia.id) return `https://sepolia.basescan.org/tx/${txHash}`;
  return `https://etherscan.io/tx/${txHash}`;
}
