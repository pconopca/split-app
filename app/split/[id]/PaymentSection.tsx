'use client';

import { ConnectButton } from '@/components/ConnectButton';
import { ShareButton } from '@/components/ShareButton';
import { ACTIVE_CHAIN } from '@/lib/contract';
import { formatUSDC } from '@/lib/usdc';

type Props = {
  idParam: string;
  isConnected: boolean;
  wrongChain: boolean;
  isCreator: boolean;
  isParticipant: boolean;
  userHasPaid: boolean;
  amountPerPerson: bigint;
  userBalance: bigint | undefined;
  hasEnoughBalance: boolean;
  needsApproval: boolean;
  isPending: boolean;
  isMining: boolean;
  error: Error | null;
  onPay: () => void;
};

export function PaymentSection({
  idParam,
  isConnected,
  wrongChain,
  isCreator,
  isParticipant,
  userHasPaid,
  amountPerPerson,
  userBalance,
  hasEnoughBalance,
  needsApproval,
  isPending,
  isMining,
  error,
  onPay,
}: Props) {
  const shareText = `Your share: $${formatUSDC(amountPerPerson)} USDC. Pay it on Base 👇`;

  return (
    <>
      {!isConnected && <ConnectButton />}

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
              text={shareText}
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
          {isParticipant && userHasPaid && (
            <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/40 p-4 text-center text-green-800 dark:text-green-200">
              <p className="font-medium">✅ You&apos;ve paid your share.</p>
            </div>
          )}
          {isParticipant && !userHasPaid && (
            <div className="flex flex-col gap-2">
              {!hasEnoughBalance && (
                <p className="text-sm text-red-500 text-center">
                  Insufficient USDC balance (
                  {userBalance !== undefined ? formatUSDC(userBalance) : '0'} available).
                </p>
              )}
              <button
                type="button"
                disabled={isPending || isMining || !hasEnoughBalance}
                onClick={onPay}
                className="w-full py-4 rounded-xl bg-[#0052ff] hover:bg-[#0040cc] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold transition-colors shadow-lg shadow-[#0052ff]/20 disabled:shadow-none"
              >
                {isPending
                  ? 'Confirm in wallet…'
                  : isMining
                    ? 'Processing…'
                    : `Pay $${formatUSDC(amountPerPerson)} USDC`}
              </button>
              {needsApproval && !isPending && !isMining && (
                <p className="text-[11px] text-zinc-500 text-center px-2">
                  One tap. Approve + pay happen in a single signature on Smart Wallet.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="text-sm text-red-500 break-words">{error.message.split('\n')[0]}</p>
      )}
    </>
  );
}
