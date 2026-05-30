'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { ShareButton } from '@/components/ShareButton';
import { Avatar, Name } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import {
  SPLIT_REGISTRY_ABI,
  SPLIT_REGISTRY_ADDRESS,
  USDC_ADDRESS,
  ACTIVE_CHAIN,
} from '@/lib/contract';
import { ERC20_ABI, formatUSDC } from '@/lib/usdc';

type Props = { idParam: string };

export default function SplitClient({ idParam }: Props) {
  const splitId = (() => {
    try {
      return BigInt(idParam);
    } catch {
      return null;
    }
  })();

  const { address, isConnected, chainId } = useAccount();
  const wrongChain = isConnected && chainId !== ACTIVE_CHAIN.id;

  const splitRegistry = SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id];
  const usdcAddress = USDC_ADDRESS[ACTIVE_CHAIN.id];

  const {
    data: splitData,
    isLoading: splitLoading,
    refetch: refetchSplit,
  } = useReadContract({
    address: splitRegistry,
    abi: SPLIT_REGISTRY_ABI,
    functionName: 'getSplit',
    args: splitId !== null ? [splitId] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: { enabled: splitId !== null },
  });

  const creator = splitData?.[0];
  const amountPerPerson = splitData?.[1];
  const participants = splitData?.[2] ?? [];
  const paidCount = splitData?.[3] ?? 0n;

  const exists = creator && creator !== '0x0000000000000000000000000000000000000000';

  const { data: paidStatuses, refetch: refetchPaid } = useReadContracts({
    contracts: participants.map((p) => ({
      address: splitRegistry,
      abi: SPLIT_REGISTRY_ABI,
      functionName: 'hasPaid' as const,
      args: [splitId!, p] as const,
      chainId: ACTIVE_CHAIN.id,
    })),
    query: { enabled: splitId !== null && participants.length > 0 },
  });

  const isParticipant =
    isConnected && address && participants.some((p) => p.toLowerCase() === address.toLowerCase());
  const isCreator = isConnected && address && creator && creator.toLowerCase() === address.toLowerCase();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, splitRegistry] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: { enabled: !!address },
  });

  const { data: userBalance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: { enabled: !!address },
  });

  const { data: hasPaidData } = useReadContract({
    address: splitRegistry,
    abi: SPLIT_REGISTRY_ABI,
    functionName: 'hasPaid',
    args: splitId !== null && address ? [splitId, address] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: { enabled: splitId !== null && !!address },
  });

  const needsApproval =
    amountPerPerson !== undefined &&
    (allowance === undefined || allowance < amountPerPerson);
  const hasEnoughBalance =
    amountPerPerson !== undefined && userBalance !== undefined && userBalance >= amountPerPerson;

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  const [phase, setPhase] = useState<'idle' | 'approving' | 'paying'>('idle');

  useEffect(() => {
    if (!receipt) return;
    refetchSplit();
    refetchPaid();
    refetchAllowance();
    if (phase === 'approving') {
      setPhase('idle');
      reset();
    } else if (phase === 'paying') {
      setPhase('idle');
      reset();
    }
  }, [receipt, phase, reset, refetchSplit, refetchPaid, refetchAllowance]);

  function handleApprove() {
    if (!amountPerPerson) return;
    setPhase('approving');
    writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [splitRegistry, amountPerPerson],
      chainId: ACTIVE_CHAIN.id,
    });
  }

  function handlePay() {
    if (splitId === null) return;
    setPhase('paying');
    writeContract({
      address: splitRegistry,
      abi: SPLIT_REGISTRY_ABI,
      functionName: 'pay',
      args: [splitId],
      chainId: ACTIVE_CHAIN.id,
    });
  }

  if (splitId === null) {
    return <Centered>Invalid split ID</Centered>;
  }
  if (splitLoading) {
    return <Centered>Loading split…</Centered>;
  }
  if (!exists) {
    return <Centered>Split #{idParam} not found.</Centered>;
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black p-6">
      <main className="w-full max-w-md mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            ← Home
          </Link>
          <ConnectButton />
        </div>

        <div className="text-center">
          <p className="text-sm text-zinc-500">Split #{idParam}</p>
          <p className="text-5xl font-bold mt-2 text-black dark:text-white">
            ${formatUSDC(amountPerPerson!)}
          </p>
          <p className="text-sm text-zinc-500 mt-1">per person · USDC</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar address={creator as `0x${string}`} chain={base} className="w-8 h-8" />
            <div className="flex flex-col">
              <p className="text-xs text-zinc-500">Created by</p>
              <Name address={creator as `0x${string}`} chain={base} className="text-sm font-medium" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Participants</p>
            <p className="text-xs text-zinc-500">
              {paidCount.toString()} / {participants.length} paid
            </p>
          </div>
          <ul className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
            {participants.map((p, i) => {
              const paid = paidStatuses?.[i]?.result === true;
              const isMe = address?.toLowerCase() === p.toLowerCase();
              return (
                <li key={p} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar address={p} chain={base} className="w-6 h-6 shrink-0" />
                    <Name
                      address={p}
                      chain={base}
                      className="text-sm font-mono truncate text-zinc-900 dark:text-zinc-100"
                    />
                    {isMe && (
                      <span className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        you
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${paid ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}`}>
                    {paid ? '✅' : '⏳'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {!isConnected && (
          <ConnectButton />
        )}

        {wrongChain && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200">
            Switch wallet to <strong>{ACTIVE_CHAIN.name}</strong> to pay.
          </div>
        )}

        {isConnected && !wrongChain && (
          <>
            {isCreator && (
              <ShareButton
                variant="secondary"
                url={typeof window !== 'undefined' ? window.location.href : ''}
                title={`Split #${idParam}`}
                text={
                  amountPerPerson
                    ? `Your share: $${formatUSDC(amountPerPerson)} USDC. Pay it on Base 👇`
                    : 'Pay your share in USDC on Base 👇'
                }
              />
            )}
            {isCreator && !isParticipant && (
              <p className="text-sm text-zinc-500 text-center">You created this split.</p>
            )}
            {!isParticipant && !isCreator && (
              <p className="text-sm text-zinc-500 text-center">
                You&apos;re not on the participant list.
              </p>
            )}
            {isParticipant && hasPaidData && (
              <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/40 p-4 text-center text-green-800 dark:text-green-200">
                <p className="font-medium">✅ You&apos;ve paid your share.</p>
              </div>
            )}
            {isParticipant && !hasPaidData && (
              <div className="flex flex-col gap-3">
                {!hasEnoughBalance && (
                  <p className="text-sm text-red-500 text-center">
                    Insufficient USDC balance ({userBalance !== undefined ? formatUSDC(userBalance) : '0'} available).
                  </p>
                )}
                {needsApproval ? (
                  <button
                    type="button"
                    disabled={isPending || isMining || !hasEnoughBalance}
                    onClick={handleApprove}
                    className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium transition-colors"
                  >
                    {phase === 'approving' && isPending && 'Confirm in wallet…'}
                    {phase === 'approving' && isMining && 'Approving USDC…'}
                    {phase !== 'approving' && `1/2 · Approve $${formatUSDC(amountPerPerson!)} USDC`}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending || isMining || !hasEnoughBalance}
                    onClick={handlePay}
                    className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium transition-colors"
                  >
                    {phase === 'paying' && isPending && 'Confirm in wallet…'}
                    {phase === 'paying' && isMining && 'Paying…'}
                    {phase !== 'paying' && `2/2 · Pay $${formatUSDC(amountPerPerson!)}`}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <p className="text-sm text-red-500 break-words">{error.message.split('\n')[0]}</p>
        )}
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500">
      {children}
    </div>
  );
}
