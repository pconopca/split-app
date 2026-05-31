'use client';

import { Avatar } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import { DisplayName } from '@/components/DisplayName';

type PaidStatus = { result?: boolean | undefined } | undefined;

type Props = {
  participants: readonly `0x${string}`[];
  paidStatuses: readonly PaidStatus[] | undefined;
  paidCount: bigint;
  viewerAddress: `0x${string}` | undefined;
  optimisticSelfPaid: boolean;
};

export function ParticipantList({
  participants,
  paidStatuses,
  paidCount,
  viewerAddress,
  optimisticSelfPaid,
}: Props) {
  const settled = paidCount === BigInt(participants.length) && participants.length > 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Participants</p>
        {settled ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
            Settled
          </span>
        ) : (
          <p className="text-xs text-zinc-500">
            {paidCount.toString()} / {participants.length} paid
          </p>
        )}
      </div>
      <ul className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
        {participants.map((p, i) => {
          const isMe = viewerAddress?.toLowerCase() === p.toLowerCase();
          const paid = paidStatuses?.[i]?.result === true || (isMe && optimisticSelfPaid);
          return (
            <li key={p} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar address={p} chain={base} className="w-6 h-6 shrink-0" />
                <DisplayName
                  address={p}
                  className="text-sm font-mono truncate text-zinc-900 dark:text-zinc-100"
                />
                {isMe && (
                  <span className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    you
                  </span>
                )}
              </div>
              <span
                className={`text-sm ${
                  paid ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'
                }`}
              >
                {paid ? '✅' : '⏳'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
