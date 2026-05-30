'use client';

import { useAddress } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import { isAddress } from 'viem';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFriends, shortAddress } from '@/lib/friends';

type Props = {
  value: string;
  onChange: (raw: string) => void;
  onResolved: (address: `0x${string}` | null) => void;
  onRemove?: () => void;
  placeholder?: string;
};

export function ParticipantInput({ value, onChange, onResolved, onRemove, placeholder }: Props) {
  const trimmed = value.trim();
  const { friends, findByAddress } = useFriends();
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (!focused) return [];
    const q = trimmed.toLowerCase();
    if (!q) return friends.slice(0, 5);
    return friends
      .filter(
        (f) =>
          f.nick.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [focused, trimmed, friends]);
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

  const friendMatch = finalAddress ? findByAddress(finalAddress) : null;

  const status = (() => {
    if (!trimmed) return null;
    if (friendMatch) return { kind: 'ok' as const, label: `${friendMatch.nick} · saved friend` };
    if (isHexAddress) return { kind: 'ok' as const, label: 'Valid address' };
    if (looksLikeBasename && isLoading) return { kind: 'pending' as const, label: 'Resolving…' };
    if (looksLikeBasename && resolved) {
      return { kind: 'ok' as const, label: `→ ${shortAddress(resolved)}` };
    }
    if (looksLikeBasename && !isLoading && !resolved)
      return { kind: 'error' as const, label: 'Name not found' };
    return { kind: 'error' as const, label: 'Enter an address or Basename' };
  })();

  return (
    <div className="flex flex-col gap-1 relative">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={placeholder ?? 'alice.base.eth or 0x…'}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0052ff]"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-20 overflow-hidden">
              {suggestions.map((f) => (
                <button
                  key={f.address}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(f.address);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {f.nick}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 shrink-0">
                    {shortAddress(f.address)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
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
