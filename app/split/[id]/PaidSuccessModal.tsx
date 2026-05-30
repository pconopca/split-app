'use client';

import { Name } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import { formatUSDC } from '@/lib/usdc';

type Props = {
  amount: bigint;
  recipient: `0x${string}`;
  onClose: () => void;
};

export function PaidSuccessModal({ amount, recipient, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col items-center gap-4 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Paid ${formatUSDC(amount)}
          </h2>
          <p className="text-sm text-zinc-500 mt-1 flex items-center justify-center gap-1.5">
            Sent to{' '}
            <Name
              address={recipient}
              chain={base}
              className="font-medium text-zinc-700 dark:text-zinc-300"
            />
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#0052ff] hover:bg-[#0040cc] text-white font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  );
}
