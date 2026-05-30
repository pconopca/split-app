'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { ConnectButton } from '@/components/ConnectButton';
import { TotalsCards } from '@/components/TotalsCards';
import { ACTIVE_CHAIN } from '@/lib/contract';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-[#0a0e1a]">
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-semibold text-lg text-zinc-900 dark:text-white">Split</span>
        </div>
        <ConnectButton />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        {isConnected ? (
          <div className="w-full flex flex-col gap-5">
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs uppercase tracking-wide font-semibold text-zinc-500">
                Your balances
              </span>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Split bills. Settle in seconds.
              </h1>
            </div>
            <TotalsCards />
            <div className="flex flex-col gap-3">
              <Link
                href="/new"
                className="w-full py-4 rounded-xl bg-[#0052ff] hover:bg-[#0040cc] text-white font-semibold text-center transition-colors shadow-lg shadow-[#0052ff]/20"
              >
                New split
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/splits"
                  className="py-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold text-center transition-colors"
                >
                  My splits
                </Link>
                <Link
                  href="/friends"
                  className="py-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold text-center transition-colors"
                >
                  Friends
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center gap-4 mb-12">
              <span className="px-3 py-1 rounded-full bg-[#0052ff]/10 text-[#0052ff] text-xs font-medium uppercase tracking-wide">
                Onchain on Base
              </span>
              <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.05]">
                Split bills.
                <br />
                <span className="text-[#0052ff]">Settle in seconds.</span>
              </h1>
              <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xs">
                Split any bill in USDC with friends. No bank, no fees, two taps to settle.
              </p>
            </div>
            <div className="w-full flex flex-col gap-3 items-center">
              <ConnectButton />
              <p className="text-xs text-zinc-500">Connect your wallet to get started</p>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-4 w-full">
              <FeatureCard icon="⚡" label="Instant" />
              <FeatureCard icon="🔒" label="Trustless" />
              <FeatureCard icon="💸" label="Zero fees" />
            </div>
          </>
        )}
      </main>

      <footer className="px-6 py-4 text-center text-xs text-zinc-400">
        Built on {ACTIVE_CHAIN.name}
      </footer>
    </div>
  );
}

function FeatureCard({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
      <span className="text-xl">{icon}</span>
      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{label}</span>
    </div>
  );
}
