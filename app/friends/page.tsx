'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFriends, shortAddress, type Friend } from '@/lib/friends';
import { ParticipantInput } from '@/components/ParticipantInput';
import { ConnectButton } from '@/components/ConnectButton';

export default function FriendsPage() {
  const { friends, add, remove } = useFriends();
  const [nick, setNick] = useState('');
  const [addressRaw, setAddressRaw] = useState('');
  const [resolved, setResolved] = useState<`0x${string}` | null>(null);

  const canSave = nick.trim().length > 0 && resolved !== null;

  function handleSave() {
    if (!canSave || !resolved) return;
    add(nick, resolved);
    setNick('');
    setAddressRaw('');
    setResolved(null);
  }

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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Friends</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Saved locally on this device. Reuse them when creating splits.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">Add a friend</p>
          <input
            type="text"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="Nickname"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0052ff]"
          />
          <ParticipantInput
            value={addressRaw}
            onChange={setAddressRaw}
            onResolved={setResolved}
          />
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="self-end px-4 py-2 rounded-lg bg-[#0052ff] hover:bg-[#0040cc] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium"
          >
            Save friend
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-white px-1">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </p>
          {friends.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">
              No friends yet. Add some above, or save them after creating a split.
            </p>
          ) : (
            <ul className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
              {friends.map((f) => (
                <FriendRow key={f.address} friend={f} onRemove={() => remove(f.address)} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function FriendRow({ friend, onRemove }: { friend: Friend; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
          {friend.nick}
        </span>
        <span className="text-xs font-mono text-zinc-500">{shortAddress(friend.address)}</span>
      </div>
      {confirming ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRemove}
            className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="px-2 py-1 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-zinc-400 hover:text-red-500 text-lg"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </li>
  );
}
