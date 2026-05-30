'use client';

import { useAccount } from 'wagmi';
import { useIsInMiniApp } from '@coinbase/onchainkit/minikit';
import Link from 'next/link';
import { ConnectButton } from '@/components/ConnectButton';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isInMiniApp } = useIsInMiniApp();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-6">
      <main className="w-full max-w-md flex flex-col gap-6 items-center text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
            Split
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Split bills in USDC with 2 taps — without leaving the feed.
          </p>
        </div>

        <ConnectButton />

        {isConnected && (
          <Link
            href="/new"
            className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            New split →
          </Link>
        )}

        <div className="text-xs text-zinc-500 dark:text-zinc-500 font-mono mt-4 space-y-1">
          <p>Mini App context: {isInMiniApp ? '✅ inside Base App' : '🌐 browser'}</p>
          <p>Wallet: {isConnected ? `✅ ${address?.slice(0, 6)}…${address?.slice(-4)}` : '❌ not connected'}</p>
        </div>
      </main>
    </div>
  );
}
