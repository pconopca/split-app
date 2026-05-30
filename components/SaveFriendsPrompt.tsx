'use client';

import { useState, useEffect } from 'react';
import { useFriends, shortAddress } from '@/lib/friends';
import { useName } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';

type Props = { addresses: `0x${string}`[] };

export function SaveFriendsPrompt({ addresses }: Props) {
  const { friends, add } = useFriends();
  const unsaved = addresses.filter(
    (a) => !friends.some((f) => f.address.toLowerCase() === a.toLowerCase()),
  );

  if (unsaved.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-zinc-900 dark:text-white">
        Save {unsaved.length === 1 ? 'this friend' : 'these friends'}?
      </p>
      <p className="text-xs text-zinc-500 -mt-2">
        Reuse them next time by typing their name.
      </p>
      {unsaved.map((addr) => (
        <SaveRow key={addr} address={addr} onSave={(nick) => add(nick, addr)} />
      ))}
    </div>
  );
}

function SaveRow({
  address,
  onSave,
}: {
  address: `0x${string}`;
  onSave: (nick: string) => void;
}) {
  const { data: basename } = useName({ address, chain: base });
  const [nick, setNick] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (basename && !nick && !saved) {
      const stripped = basename.replace(/\.base\.eth$|\.eth$/, '');
      setNick(stripped);
    }
  }, [basename, nick, saved]);

  if (saved) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30">
        <span className="text-sm text-green-700 dark:text-green-300">
          ✓ {nick || shortAddress(address)}
        </span>
        <span className="text-xs text-zinc-500 font-mono">{shortAddress(address)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        placeholder={shortAddress(address)}
        className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0052ff]"
      />
      <button
        type="button"
        onClick={() => {
          onSave(nick);
          setSaved(true);
        }}
        className="px-3 py-2 rounded-lg bg-[#0052ff] hover:bg-[#0040cc] text-white text-sm font-medium"
      >
        Save
      </button>
    </div>
  );
}
