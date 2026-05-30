'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog, parseUnits } from 'viem';
import Link from 'next/link';
import { ConnectButton } from '@/components/ConnectButton';
import { SPLIT_REGISTRY_ABI, SPLIT_REGISTRY_ADDRESS, ACTIVE_CHAIN } from '@/lib/contract';
import { ParticipantInput } from '@/components/ParticipantInput';

type Row = {
  id: string;
  raw: string;
  resolved: `0x${string}` | null;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function NewSplitPage() {
  const { isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { id: uid(), raw: '', resolved: null },
    { id: uid(), raw: '', resolved: null },
  ]);

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({ hash: txHash });

  const amountPerPersonUSDC = (() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    try {
      return parseUnits(amount, 6);
    } catch {
      return null;
    }
  })();

  const resolvedAddresses = rows
    .map((r) => r.resolved)
    .filter((a): a is `0x${string}` => !!a);

  const dedupedAddresses = Array.from(new Set(resolvedAddresses.map((a) => a.toLowerCase()))) as `0x${string}`[];

  const canSubmit =
    isConnected &&
    amountPerPersonUSDC !== null &&
    dedupedAddresses.length > 0 &&
    dedupedAddresses.length === resolvedAddresses.length &&
    !isPending &&
    !isMining;

  const wrongChain = isConnected && chainId !== ACTIVE_CHAIN.id;

  const createdSplitId = (() => {
    if (!receipt) return null;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: SPLIT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'SplitCreated') {
          return decoded.args.splitId;
        }
      } catch {
        // not our event
      }
    }
    return null;
  })();

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { id: uid(), raw: '', resolved: null }]);
  }
  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function handleSubmit() {
    if (!canSubmit || amountPerPersonUSDC === null) return;
    const contractAddress = SPLIT_REGISTRY_ADDRESS[ACTIVE_CHAIN.id];
    writeContract({
      address: contractAddress,
      abi: SPLIT_REGISTRY_ABI,
      functionName: 'createSplit',
      args: [amountPerPersonUSDC, dedupedAddresses],
      chainId: ACTIVE_CHAIN.id,
    });
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black p-6">
      <main className="w-full max-w-md mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            ← Back
          </Link>
          <ConnectButton />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">New split</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Each participant pays the amount below in USDC.
          </p>
        </div>

        {wrongChain && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200">
            Wallet is on chain {chainId}. Switch to <strong>{ACTIVE_CHAIN.name}</strong> to continue.
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Amount per person (USDC)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="20.00"
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Participants
            </label>
            <span className="text-xs text-zinc-500">
              {dedupedAddresses.length} valid
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <ParticipantInput
                key={row.id}
                value={row.raw}
                onChange={(raw) => updateRow(row.id, { raw })}
                onResolved={(resolved) => updateRow(row.id, { resolved })}
                onRemove={rows.length > 1 ? () => removeRow(row.id) : undefined}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="self-start text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            + Add participant
          </button>
        </div>

        {!isConnected ? (
          <ConnectButton />
        ) : (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium transition-colors"
          >
            {isPending
              ? 'Confirm in wallet…'
              : isMining
                ? 'Creating split…'
                : 'Create split'}
          </button>
        )}

        {error && (
          <p className="text-sm text-red-500 break-words">
            {error.message.split('\n')[0]}
          </p>
        )}

        {createdSplitId !== null && (
          <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/40 p-4 text-sm text-green-800 dark:text-green-200 flex flex-col gap-3">
            <p className="font-medium">✅ Split #{createdSplitId.toString()} created</p>
            <Link
              href={`/split/${createdSplitId.toString()}`}
              className="block w-full text-center py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Open split →
            </Link>
            {txHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline break-all"
              >
                View transaction on Basescan
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
