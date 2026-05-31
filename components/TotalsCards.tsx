'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useUserSplits } from '@/lib/useUserSplits';
import { computeTotals } from '@/lib/aggregates';
import { formatUSDC } from '@/lib/usdc';

export function TotalsCards() {
  const { address, isConnected } = useAccount();
  const { splits, isLoading, error } = useUserSplits(address);
  const totals = useMemo(() => computeTotals(splits), [splits]);

  if (!isConnected) return null;

  if (error) {
    return (
      <p className="text-xs text-zinc-500 text-center">
        Couldn&apos;t load your balances right now.
      </p>
    );
  }

  if (isLoading && splits.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const oweEmpty = totals.youOwe === 0n;
  const owedEmpty = totals.owedToYou === 0n;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/splits?tab=participant"
        className={`p-4 rounded-xl border transition-colors ${
          oweEmpty
            ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'
            : 'border-[#0052ff]/30 bg-[#0052ff]/5 hover:bg-[#0052ff]/10'
        }`}
      >
        <p className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
          You owe
        </p>
        <p
          className={`text-2xl font-bold mt-1 ${
            oweEmpty
              ? 'text-zinc-400'
              : 'text-[#0052ff]'
          }`}
        >
          ${formatUSDC(totals.youOwe)}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {totals.youOweCount === 0
            ? 'All clear'
            : `${totals.youOweCount} split${totals.youOweCount === 1 ? '' : 's'}`}
        </p>
      </Link>
      <Link
        href="/splits?tab=created"
        className={`p-4 rounded-xl border transition-colors ${
          owedEmpty
            ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'
            : 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
        }`}
      >
        <p className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500">
          Owed to you
        </p>
        <p
          className={`text-2xl font-bold mt-1 ${
            owedEmpty
              ? 'text-zinc-400'
              : 'text-green-600 dark:text-green-400'
          }`}
        >
          ${formatUSDC(totals.owedToYou)}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {totals.owedToYouCount === 0
            ? 'Nothing pending'
            : `${totals.owedToYouCount} split${totals.owedToYouCount === 1 ? '' : 's'}`}
        </p>
      </Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 animate-pulse">
      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
      <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
      <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
    </div>
  );
}
