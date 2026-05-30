'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useState } from 'react';
import { ACTIVE_CHAIN } from '@/lib/contract';

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-60"
        >
          {isPending ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50 overflow-hidden">
            {connectors.length === 0 && (
              <p className="p-3 text-xs text-zinc-500">No wallets detected.</p>
            )}
            {connectors.map((c) => (
              <button
                key={c.uid}
                type="button"
                onClick={() => {
                  connect({ connector: c });
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-between"
              >
                <span>{c.name}</span>
                <span className="text-[10px] text-zinc-400 uppercase">{c.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const wrongChain = chainId !== ACTIVE_CHAIN.id;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-2 rounded-lg text-sm font-mono ${
          wrongChain
            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {wrongChain ? '⚠ ' : ''}
        {address?.slice(0, 6)}…{address?.slice(-4)}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50 overflow-hidden flex flex-col">
          {wrongChain && (
            <button
              type="button"
              onClick={() => {
                switchChain({ chainId: ACTIVE_CHAIN.id });
                setOpen(false);
              }}
              disabled={isSwitching}
              className="text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-amber-700 dark:text-amber-300"
            >
              {isSwitching ? 'Switching…' : `Switch to ${ACTIVE_CHAIN.name}`}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 dark:text-red-400"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
