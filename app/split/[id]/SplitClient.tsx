'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSendCalls,
  useWaitForCallsStatus,
} from 'wagmi';
import { encodeFunctionData } from 'viem';
import { ConnectButton } from '@/components/ConnectButton';
import {
  SPLIT_REGISTRY_ABI,
  SPLIT_REGISTRY_ADDRESS,
  USDC_ADDRESS,
  ACTIVE_CHAIN,
} from '@/lib/contract';
import { ERC20_ABI } from '@/lib/usdc';
import { SplitHeader } from './SplitHeader';
import { ParticipantList } from './ParticipantList';
import { PaymentSection } from './PaymentSection';
import { PaidSuccessModal } from './PaidSuccessModal';

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

  // --- onchain reads ---

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
  const memo = splitData?.[4] ?? '';
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

  const { data: hasPaidData, refetch: refetchHasPaid } = useReadContract({
    address: splitRegistry,
    abi: SPLIT_REGISTRY_ABI,
    functionName: 'hasPaid',
    args: splitId !== null && address ? [splitId, address] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: { enabled: splitId !== null && !!address },
  });

  // --- derived state ---

  const isParticipant =
    !!isConnected && !!address && participants.some((p) => p.toLowerCase() === address.toLowerCase());
  const isCreator =
    !!isConnected && !!address && !!creator && creator.toLowerCase() === address.toLowerCase();
  const needsApproval =
    amountPerPerson !== undefined && (allowance === undefined || allowance < amountPerPerson);
  const hasEnoughBalance =
    amountPerPerson !== undefined && userBalance !== undefined && userBalance >= amountPerPerson;

  // --- write tx (batched) ---

  const { sendCalls, data: callsData, isPending, error, reset } = useSendCalls();
  const { data: callsStatus } = useWaitForCallsStatus({
    id: callsData?.id,
    query: { enabled: !!callsData?.id },
  });
  const isMining =
    callsData !== undefined &&
    callsStatus?.status !== 'success' &&
    callsStatus?.status !== 'failure';
  const justSucceeded = callsStatus?.status === 'success';

  const [showSuccess, setShowSuccess] = useState(false);
  const [optimisticPaid, setOptimisticPaid] = useState(false);
  const userHasPaid = hasPaidData === true || optimisticPaid;

  useEffect(() => {
    if (!justSucceeded) return;
    setOptimisticPaid(true);
    setShowSuccess(true);
    // Retry the refetches a couple times so we eventually match real state.
    const tick = () => {
      refetchSplit();
      refetchPaid();
      refetchAllowance();
      refetchHasPaid();
    };
    tick();
    const t1 = setTimeout(tick, 1500);
    const t2 = setTimeout(tick, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [justSucceeded, refetchSplit, refetchPaid, refetchAllowance, refetchHasPaid]);

  function handlePay() {
    if (splitId === null || amountPerPerson === undefined) return;
    reset();
    // EIP-5792 batch: Smart Wallet executes both calls in a single signature.
    // Wallets without batch support fall back to sequential transactions.
    const calls = [
      ...(needsApproval
        ? [
            {
              to: usdcAddress,
              data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [splitRegistry, amountPerPerson],
              }),
            },
          ]
        : []),
      {
        to: splitRegistry,
        data: encodeFunctionData({
          abi: SPLIT_REGISTRY_ABI,
          functionName: 'pay',
          args: [splitId],
        }),
      },
    ];
    sendCalls({ calls, chainId: ACTIVE_CHAIN.id });
  }

  // --- render ---

  if (splitId === null) return <Centered>Invalid split ID</Centered>;
  if (splitLoading) return <Centered>Loading split…</Centered>;
  if (!exists || amountPerPerson === undefined || !creator) {
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

        <SplitHeader
          idParam={idParam}
          memo={memo}
          amountPerPerson={amountPerPerson}
          creator={creator as `0x${string}`}
        />

        <ParticipantList
          participants={participants}
          paidStatuses={paidStatuses}
          paidCount={paidCount}
          viewerAddress={address}
          optimisticSelfPaid={optimisticPaid}
        />

        <PaymentSection
          idParam={idParam}
          isConnected={!!isConnected}
          wrongChain={!!wrongChain}
          isCreator={isCreator}
          isParticipant={isParticipant}
          userHasPaid={userHasPaid}
          amountPerPerson={amountPerPerson}
          userBalance={userBalance}
          hasEnoughBalance={hasEnoughBalance}
          needsApproval={needsApproval}
          isPending={isPending}
          isMining={isMining}
          error={error}
          onPay={handlePay}
        />
      </main>

      {showSuccess && (
        <PaidSuccessModal
          amount={amountPerPerson}
          recipient={creator as `0x${string}`}
          onClose={() => setShowSuccess(false)}
        />
      )}
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
