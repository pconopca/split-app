'use client';

import { useAddress } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import { isAddress } from 'viem';
import { useEffect, useMemo, useRef } from 'react';

type Props = {
  value: string;
  onChange: (raw: string) => void;
  onResolved: (address: `0x${string}` | null) => void;
  onRemove?: () => void;
  placeholder?: string;
};

export function ParticipantInput({ value, onChange, onResolved, onRemove, placeholder }: Props) {
  const trimmed = value.trim();
  const looksLikeBasename = useMemo(
    () => trimmed.toLowerCase().endsWith('.base.eth') || trimmed.toLowerCase().endsWith('.eth'),
    [trimmed]
  );
  const isHexAddress = isAddress(trimmed);

  const { data: resolved, isLoading } = useAddress(
    { name: trimmed, chain: base },
    { enabled: looksLikeBasename && trimmed.length > 5 }
  );

  const finalAddress: `0x${string}` | null = isHexAddress
    ? (trimmed as `0x${string}`)
    : (resolved ?? null);

  const lastNotified = useRef<`0x${string}` | null | undefined>(undefined);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  useEffect(() => {
    if (lastNotified.current !== finalAddress) {
      lastNotified.current = finalAddress;
      onResolvedRef.current(finalAddress);
    }
  }, [finalAddress]);

  const status = (() => {
    if (!trimmed) return null;
    if (isHexAddress) return { kind: 'ok' as const, label: 'Valid address' };
    if (looksLikeBasename && isLoading) return { kind: 'pending' as const, label: 'Resolving…' };
    if (looksLikeBasename && resolved) {
      return { kind: 'ok' as const, label: `→ ${resolved.slice(0, 6)}…${resolved.slice(-4)}` };
    }
    if (looksLikeBasename && !isLoading && !resolved)
      return { kind: 'error' as const, label: 'Name not found' };
    return { kind: 'error' as const, label: 'Enter an address or Basename' };
  })();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'alice.base.eth or 0x…'}
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-zinc-400 hover:text-red-500 text-lg w-8"
            aria-label="Remove"
          >
            ×
          </button>
        )}
      </div>
      {status && (
        <p
          className={`text-xs px-1 ${
            status.kind === 'ok'
              ? 'text-green-600 dark:text-green-400'
              : status.kind === 'pending'
                ? 'text-zinc-500'
                : 'text-red-500'
          }`}
        >
          {status.label}
        </p>
      )}
    </div>
  );
}
