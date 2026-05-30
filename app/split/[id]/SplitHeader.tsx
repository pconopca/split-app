'use client';

import { Avatar, Name } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import { formatUSDC } from '@/lib/usdc';

type Props = {
  idParam: string;
  memo: string;
  amountPerPerson: bigint;
  creator: `0x${string}`;
};

export function SplitHeader({ idParam, memo, amountPerPerson, creator }: Props) {
  return (
    <>
      <div className="text-center">
        <p className="text-sm text-zinc-500">Split #{idParam}</p>
        {memo && (
          <p className="text-lg font-medium text-zinc-900 dark:text-white mt-1">
            {memo}
          </p>
        )}
        <p className="text-5xl font-bold mt-2 text-black dark:text-white">
          ${formatUSDC(amountPerPerson)}
        </p>
        <p className="text-sm text-zinc-500 mt-1">per person · USDC</p>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center gap-3">
        <Avatar address={creator} chain={base} className="w-8 h-8" />
        <div className="flex flex-col">
          <p className="text-xs text-zinc-500">Created by</p>
          <Name address={creator} chain={base} className="text-sm font-medium" />
        </div>
      </div>
    </>
  );
}
