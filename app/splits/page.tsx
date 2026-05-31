'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { useUserSplits, type UserSplit } from '@/lib/useUserSplits';
import { formatUSDC } from '@/lib/usdc';

type Tab = 'created' | 'participant';

export default function SplitsPage() {
  return (
    <Suspense fallback={null}>
      <SplitsPageInner />
    </Suspense>
  );
}

function SplitsPageInner() {
  const { address, isConnected } = useAccount();
  const { splits, isLoading, error } = useUserSplits(address);
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get('tab') === 'participant' ? 'participant' : 'created';
  const [tab, setTab] = useState<Tab>(initialTab);

  // Keep the tab in sync when the user navigates back to /splits with a
  // different ?tab= query string (e.g. clicking another card on home).
  useEffect(() => {
    const next = searchParams.get('tab') === 'participant' ? 'participant' : 'created';
    setTab(next);
  }, [searchParams]);

  // Cancelled splits are hidden from both tabs. They are still visible if
  // the user navigates to /split/[id] directly (and shown as cancelled there).
  const active = splits.filter((s) => !s.cancelled);
  const created = active.filter((s) => s.role === 'creator' || s.role === 'both');
  const asParticipant = active.filter((s) => s.role === 'participant' || s.role === 'both');
  const list = tab === 'created' ? created : asParticipant;

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-[#0a0e1a]">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Home
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My splits</h1>
          <p className="text-sm text-zinc-500 mt-1">All your splits, fresh from the chain.</p>
        </div>

        {!isConnected && (
          <div className="flex flex-col items-center gap-3 py-12">
            <ConnectButton />
            <p className="text-sm text-zinc-500">Connect your wallet to see your splits.</p>
          </div>
        )}

        {isConnected && (
          <>
            <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <TabButton active={tab === 'created'} onClick={() => setTab('created')}>
                Created ({created.length})
              </TabButton>
              <TabButton active={tab === 'participant'} onClick={() => setTab('participant')}>
                Owed by me ({asParticipant.length})
              </TabButton>
            </div>

            {isLoading && (
              <p className="text-sm text-zinc-500 text-center py-12">Loading from chain…</p>
            )}

            {error && (
              <p className="text-sm text-red-500 break-words">{error.message.split('\n')[0]}</p>
            )}

            {!isLoading && list.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm text-zinc-500">
                  {tab === 'created'
                    ? "You haven't created any splits yet."
                    : "You're not in any splits."}
                </p>
                {tab === 'created' && (
                  <Link
                    href="/new"
                    className="mt-2 px-4 py-2 rounded-lg bg-[#0052ff] hover:bg-[#0040cc] text-white text-sm font-medium"
                  >
                    Create your first split
                  </Link>
                )}
              </div>
            )}

            <ul className="flex flex-col gap-2">
              {list.map((s) => (
                <SplitCard key={s.id.toString()} split={s} viewerAddress={address!} />
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

function SplitCard({ split, viewerAddress }: { split: UserSplit; viewerAddress: `0x${string}` }) {
  const total = split.amountPerPerson * BigInt(split.participants.length);
  const allPaid = split.paidCount === BigInt(split.participants.length);
  const isParticipant = split.participants.some(
    (p) => p.toLowerCase() === viewerAddress.toLowerCase(),
  );
  const youOwe = split.role !== 'creator' && isParticipant && !split.hasPaidByUser;
  const youPaid = isParticipant && split.hasPaidByUser;

  return (
    <li>
      <Link
        href={`/split/${split.id.toString()}`}
        className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-[#0052ff]/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-zinc-500 font-medium">Split #{split.id.toString()}</span>
            {split.memo ? (
              <span className="text-base font-semibold text-zinc-900 dark:text-white truncate">
                {split.memo}
              </span>
            ) : null}
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">
              ${formatUSDC(split.amountPerPerson)}
            </span>
            <span className="text-xs text-zinc-500">
              per person · ${formatUSDC(total)} total
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                allPaid
                  ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              }`}
            >
              {split.paidCount.toString()} / {split.participants.length} paid
            </span>
            {youOwe && (
              <span className="text-xs text-[#0052ff] font-medium">You owe</span>
            )}
            {youPaid && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                You paid ✓
              </span>
            )}
            {split.role === 'creator' && !allPaid && (
              <span className="text-xs text-zinc-500">Collecting</span>
            )}
            {allPaid && <span className="text-xs text-zinc-500">Settled</span>}
          </div>
        </div>
      </Link>
    </li>
  );
}
